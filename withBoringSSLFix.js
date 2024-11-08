// withBoringSSLFix.js

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withBoringSSLFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContents = fs.readFileSync(podfilePath, 'utf-8');

      //  Fix for the Podfile
      const fix = `
  pre_install do |installer|
    installer.pod_targets.each do |pod|
      if pod.name.eql?('BoringSSL-GRPC')
        def pod.build_type;
          Pod::BuildType.static_library
        end
      end
    end
  end
`;

      // Adding the fix before the first 'post_install' occurrence
      if (!podfileContents.includes("pod.name.eql?('BoringSSL-GRPC')")) {
        const postInstallIndex = podfileContents.indexOf('post_install do |installer|');
        if (postInstallIndex !== -1) {
          podfileContents = podfileContents.slice(0, postInstallIndex) + fix + podfileContents.slice(postInstallIndex);
        } else {
          // If there's no post_install, append the fix at the end
          podfileContents += fix;
        }
        fs.writeFileSync(podfilePath, podfileContents);
      }

      return config;
    },
  ]);
};

module.exports = withBoringSSLFix;