const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Xcode 26 + React-Native-bundled fmt 11.0.2 incompatibility.
 *
 * Xcode 26's Clang enforces `consteval` constant-expression evaluation more
 * strictly and rejects fmt's *own* internal compile-time format strings
 * (errors in fmt/format-inl.h: "Call to consteval function ... is not a
 * constant expression"). fmt's consteval gate in base.h has no user-override
 * guard, so a command-line -D can't disable it.
 *
 * This plugin injects a `post_install` step into the generated Podfile that
 * patches Pods/fmt/.../base.h to force `FMT_USE_CONSTEVAL 0` after pods are
 * downloaded. That disables fmt's *compile-time* format-string checking only —
 * runtime behaviour is unchanged (fmt is a transitive dep used by RN logging).
 *
 * Idempotent: keyed on the `[fmt-consteval-fix]` marker, so it no-ops if the
 * patch (or another copy of this hook) is already present.
 */
const POST_INSTALL_PATCH = `
    # [fmt-consteval-fix] Xcode 26 + RN-bundled fmt 11.0.2: force FMT_USE_CONSTEVAL 0
    # so the stricter Clang doesn't reject fmt's internal consteval format strings.
    fmt_base = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      contents = File.read(fmt_base)
      unless contents.include?('[fmt-consteval-fix]')
        contents.sub!(
          "#endif\\n#if FMT_USE_CONSTEVAL\\n#  define FMT_CONSTEVAL consteval",
          "#endif\\n// [fmt-consteval-fix]\\n#undef FMT_USE_CONSTEVAL\\n#define FMT_USE_CONSTEVAL 0\\n#if FMT_USE_CONSTEVAL\\n#  define FMT_CONSTEVAL consteval"
        )
        File.write(fmt_base, contents)
      end
    end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes('[fmt-consteval-fix]')) {
        contents = contents.replace(
          /post_install do \|installer\|\n/,
          (match) => `${match}${POST_INSTALL_PATCH}`
        );
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
