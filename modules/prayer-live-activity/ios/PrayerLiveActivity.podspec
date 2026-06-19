Pod::Spec.new do |s|
  s.name           = 'PrayerLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Prayer Live Activity (ActivityKit) controller'
  s.description    = 'Start / update / end the prayer countdown Live Activity from JS.'
  s.author         = 'Rihlah'
  s.homepage       = 'https://github.com/mdnaeem95/musollah'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
