const config = {
    appName:'throughnotify'
}
export default config;

export function mergeConfig(newConfig) {
    return Object.assign(config, newConfig);
}
export function getConfig() {
    return config
}