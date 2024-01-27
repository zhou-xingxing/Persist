const fs = require("fs");
const path = require("node:path");
module.exports = {
    packagerConfig: {
        asar: {
            // 指定目录不打包进asar
            unpackDir: 'data',
        },
        // 必须是.icns格式
        icon: 'dependencies/Persist.icns',
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
    ],
    hooks: {
    }
};
