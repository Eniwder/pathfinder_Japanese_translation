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
        static TMP_FontAsset s_jpFont;
        static readonly HashSet<int> s_fixedFonts = new HashSet<int>();

        public static bool Load(UnityModManager.ModEntry modEntry)
        {
            s_mod = modEntry;
            new Harmony(modEntry.Info.Id).PatchAll(Assembly.GetExecutingAssembly());
            return true;
        }

        // I18NFont4UnityGame が AssetBundle から読み込んだ TMP フォントを借りる
        static TMP_FontAsset JpFont
        {
            get
            {
                if (s_jpFont != null) return s_jpFont;
                var type = AccessTools.TypeByName("I18NFont4UnityGame.I18NFont4UnityGame");
                if (type != null) s_jpFont = AccessTools.Field(type, "s_tmpTranslateFont")?.GetValue(null) as TMP_FontAsset;
                return s_jpFont;
            }
        }

        internal static void Fix(TMP_Text text)
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
