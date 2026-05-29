#!/bin/bash
# SAT APK 一键构建脚本
# 用法: bash build-apk.sh [debug|release]

set -e

BUILD_TYPE="${1:-release}"

echo "=== SAT APK 构建脚本 ==="
echo "构建类型: $BUILD_TYPE"
echo ""

# 设置环境变量
export JAVA_HOME="${JAVA_HOME:-/c/Users/pigo/jdk17/jdk-17.0.2}"
export ANDROID_HOME="${ANDROID_HOME:-/d/.temp/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Java 版本:"
java -version 2>&1 | head -1

echo ""
echo "步骤 1/4: 构建前端..."
cd /d/.temp/sat-app
npm run build 2>&1 | tail -3

echo ""
echo "步骤 2/4: 同步 Capacitor..."
npx cap sync android 2>&1 | tail -3

echo ""
echo "步骤 3/4: 构建 $BUILD_TYPE APK..."
cd /d/.temp/sat-app/android
chmod +x ./gradlew 2>/dev/null || true

if [ "$BUILD_TYPE" = "release" ]; then
    ./gradlew assembleRelease 2>&1
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    ./gradlew assembleDebug 2>&1
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""
echo "步骤 4/4: 复制 APK 到输出目录..."
mkdir -p /d/.temp/sat-app/output
cp "$APK_PATH" "/d/.temp/sat-app/output/SAT-${BUILD_TYPE}.apk" 2>/dev/null

echo ""
echo "=== 构建完成! ==="
echo "APK 文件位置: /d/.temp/sat-app/output/SAT-${BUILD_TYPE}.apk"
echo "原始位置: /d/.temp/sat-app/android/$APK_PATH"
echo ""
echo "文件大小:"
ls -lh "/d/.temp/sat-app/output/SAT-${BUILD_TYPE}.apk" 2>/dev/null || ls -lh "/d/.temp/sat-app/android/$APK_PATH"
