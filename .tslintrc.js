module.exports = {
    "defaultSeverity": "warning",
    "extends": [
        "tslint-react",
        "tslint-config-airbnb",
        "tslint-plugin-prettier"
    ],
    "rules": {
        "class-name": true,
        "forin": true,
        "jsdoc-format": true,
        "jsx-boolean-value": [
            true,
            "never"
        ],
        "max-line-length": [true, 105],
        "jsx-no-multiline-js": false,
        "member-access": true,
        "member-ordering": [
            true,
            "variables-before-functions",
            "public-before-private"
        ],
        "quotemark": [
            true,
            "single",
            "jsx-double",
            "avoid-escape"
        ],
        "semicolon": [
            true,
            "always",
            "ignore-bound-class-methods"
        ],
        "typedef-whitespace": [
            true,
            {
                "call-signature": "nospace",
                "index-signature": "nospace",
                "parameter": "nospace",
                "property-declaration": "nospace",
                "variable-declaration": "nospace"
            }
        ],
        "variable-name": [
            true,
            "ban-keywords",
            "check-format",
            "allow-pascal-case"
        ]
    }
}
