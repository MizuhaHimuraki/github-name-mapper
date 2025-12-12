#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'manifest.json');
const releaseDir = path.join(repoRoot, 'release');

function fail(message) {
    process.stderr.write(`${message}\n`);
    process.exit(1);
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        fail(`Failed to read JSON: ${filePath}\n${err.message || err}`);
    }
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function existsOrFail(filePath) {
    if (!fs.existsSync(filePath)) fail(`Missing required file/folder: ${path.relative(repoRoot, filePath)}`);
}

function sanitizeFilenameSegment(value) {
    return String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '') || 'extension';
}

function runZip(zipPath, includePaths) {
    const args = ['-r', zipPath, ...includePaths, '-x', '*.DS_Store'];
    const result = spawnSync('zip', args, { cwd: repoRoot, stdio: 'inherit' });
    if (result.error) {
        fail(
            `Failed to execute 'zip'. Make sure it is installed and available on PATH.\n` +
            `On macOS it is usually available by default.\n` +
            `${result.error.message || result.error}`
        );
    }
    if (result.status !== 0) {
        fail(`zip exited with code ${result.status}`);
    }
}

function main() {
    const argv = process.argv.slice(2);
    const clean = argv.includes('--clean');

    existsOrFail(manifestPath);
    const manifest = readJson(manifestPath);
    const version = manifest.version;
    if (!version) fail('manifest.json is missing required field: version');

    const baseName = sanitizeFilenameSegment(manifest.name || 'github-name-mapper');
    const zipName = `${baseName}-v${version}.zip`;
    const zipPath = path.join(releaseDir, zipName);

    // 清空 release 目录
    if (fs.existsSync(releaseDir)) {
        fs.rmSync(releaseDir, { recursive: true, force: true });
    }
    ensureDir(releaseDir);

    const include = [
        'manifest.json',
        'background.js',
        'content.js',
        'content.css',
        'popup.html',
        'popup.js',
        'popup.css',
        'options.html',
        'options.js',
        'options.css',
        'icons',
        'LICENSE',
        'CHANGELOG.md',
        'README.md'
    ];

    for (const item of include) {
        existsOrFail(path.join(repoRoot, item));
    }

    runZip(zipPath, include);

    process.stdout.write(`\nCreated: ${path.relative(repoRoot, zipPath)}\n`);
}

main();
