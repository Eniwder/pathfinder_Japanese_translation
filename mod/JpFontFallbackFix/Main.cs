using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using HarmonyLib;
using TMPro;
using UnityModManagerNet;

namespace JpFontFallbackFix
{
    // I18NFont4UnityGame は日本語フォントを fallbackFontAssetTable の「末尾」に追加するため、
    // それより前にあるゲーム同梱の中国語フォントが持つ漢字（「文」など）は簡体字の字形で描画される。
    // 主フォント（欧文）はそのままに、日本語フォントを fallback の「先頭」へ移して優先させる。
    public static class Main
    {
        static UnityModManager.ModEntry s_mod;
        static FieldInfo s_jpFontField;
        static TMP_FontAsset s_jpFont;
        static bool s_failed;
        static readonly HashSet<int> s_fixedFonts = new HashSet<int>();

        public static bool Load(UnityModManager.ModEntry modEntry)
        {
            s_mod = modEntry;
            // I18NFont4UnityGame が AssetBundle から読み込んだ TMP フォントを借りる。
            // 型の検索は重いので起動時に1回だけ行う（テキスト表示のたびに探すとロードや一覧画面が固まる）
            var type = AccessTools.TypeByName("I18NFont4UnityGame.I18NFont4UnityGame");
            s_jpFontField = type != null ? AccessTools.Field(type, "s_tmpTranslateFont") : null;
            if (s_jpFontField == null)
            {
                modEntry.Logger.Log("I18NFont4UnityGame が見つからないため無効化します。");
                return false;
            }
            new Harmony(modEntry.Info.Id).PatchAll(Assembly.GetExecutingAssembly());
            return true;
        }

        static TMP_FontAsset JpFont
        {
            get
            {
                if (s_jpFont == null) s_jpFont = s_jpFontField.GetValue(null) as TMP_FontAsset;
                return s_jpFont;
            }
        }

        internal static void Fix(TMP_Text text)
        {
            if (s_failed) return;
            try
            {
                var jp = JpFont;
                var font = text != null ? text.font : null;
                if (jp == null || font == null || font == jp) return;
                if (!s_fixedFonts.Add(font.GetInstanceID())) return;

                if (font.fallbackFontAssetTable == null) font.fallbackFontAssetTable = new List<TMP_FontAsset>();
                var fallbacks = font.fallbackFontAssetTable;
                s_mod.Logger.Log($"{font.name}: [{string.Join(", ", fallbacks.Select(f => f != null ? f.name : "null"))}]");
                fallbacks.RemoveAll(f => f == jp);
                fallbacks.Insert(0, jp);
            }
            catch (System.Exception ex)
            {
                // ゲーム側の UI 構築を巻き込まないよう、例外は外に出さず以後は何もしない
                s_failed = true;
                s_mod.Logger.Log($"例外が発生したため無効化します: {ex}");
            }
        }
    }

    [HarmonyPatch(typeof(TextMeshProUGUI), "OnEnable")]
    [HarmonyPriority(Priority.Last)]
    static class TextMeshProUGUIPatch
    {
        static void Postfix(TextMeshProUGUI __instance) => Main.Fix(__instance);
    }

    [HarmonyPatch(typeof(TextMeshPro), "OnEnable")]
    static class TextMeshProPatch
    {
        static void Postfix(TextMeshPro __instance) => Main.Fix(__instance);
    }

    [HarmonyPatch(typeof(TMP_Text), nameof(TMP_Text.font), MethodType.Setter)]
    static class FontSetterPatch
    {
        static void Postfix(TMP_Text __instance) => Main.Fix(__instance);
    }
}
