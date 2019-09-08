// FIXME: Once babel config is centralized in `@purtuga/project-base` -- reuse it below.
require("@babel/register")({
    babelrc: false,
    presets: [
        [
            "@babel/preset-env",
            {
                modules: false,
                loose: true,
                targets: {
                    browsers: "last 2 Firefox versions"
                }
            }
        ]
    ],
    plugins: [
        [
            "@babel/plugin-transform-runtime",
            {
                "corejs": false,
                "helpers": true,
                "regenerator": true,
                "useESModules": true
            }
        ],
        ["@babel/plugin-transform-async-to-generator"],
        [
            "@babel/plugin-proposal-decorators",
            {
                "legacy": false,
                decoratorsBeforeExport: true
            }
        ],
        [
            "@babel/plugin-proposal-class-properties",
            {
                "loose" : false
            }
        ]
    ]
});