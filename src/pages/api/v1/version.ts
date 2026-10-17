// TODO: DATABASE

export function GET({ params, request }) {
  return new Response(
    JSON.stringify({
      stable: 3,
      dev: 4,
      versions: {
        4: {
          name: 'v1.1.0-dev.1',
          changelog: 'Development build; see GitHub.',
          download: {
            direct:
              'https://dl.theclashfruit.me/apps/me.theclashfruit.rithle/4/app-debug.apk',
            github:
              'https://github.com/TheClashFruit/Rithle/releases/tag/v1.1.0-dev.1'
          }
        },
        3: {
          name: 'v1.0.0',
          chnagelog:
            '## Added\n\n* A toggleable update checker on app launch.\n\n**Full Changelog**: https://github.com/TheClashFruit/Rithle/compare/v1.0.0-beta.2...v1.0.0',
          download: {
            direct:
              'https://dl.theclashfruit.me/apps/me.theclashfruit.rithle/3/app-release.apk',
            github:
              'https://github.com/TheClashFruit/Rithle/releases/tag/v1.0.0'
          }
        },
        2: {
          name: 'v1.0.0-beta.2',
          changelog: `## Fixes\n\n* Markdown will not re-render whenever the toolbar collapses/expands.\n* Fixed crash on notifications screen when not logged in.\n\n## Added\n\n* Follow & unfollow projects.\n* Copy project id & permanent link.\n\n**Full Changelog**: https://github.com/TheClashFruit/Rithle/compare/v1.0.0-beta.1...v1.0.0-beta.2`,
          download: {
            direct:
              'https://dl.theclashfruit.me/apps/me.theclashfruit.rithle/2/app-release.apk',
            github:
              'https://github.com/TheClashFruit/Rithle/releases/tag/v1.0.0-beta.2'
          }
        },
        1: {
          name: 'v1.0.0-beta.1',
          changelog:
            '3 years it took... A complete rewrite of Rithle in Jetpack Compose, hopefully includes everything needed to browse Modrinth.\n\n## Changes\n\nToo much, can we call this the initial release?',
          download: {
            direct:
              'https://dl.theclashfruit.me/apps/me.theclashfruit.rithle/1/app-release.apk',
            github:
              'https://github.com/TheClashFruit/Rithle/releases/tag/v1.0.0-beta.1'
          }
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
