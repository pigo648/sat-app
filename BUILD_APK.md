# SAT APK 构建指南

## 当前状况

你的 C 盘空间不足（已满），D 盘没有写入权限，因此无法在当前环境直接构建 APK。

## 方案一：清理 C 盘后本地构建（推荐，最快）

1. 清理 C 盘，至少腾出 5GB 空间
2. 确保 D 盘有写入权限，或直接在 C 盘腾出足够空间
3. 运行以下命令：

```bash
export JAVA_HOME="/c/Users/pigo/jdk17/jdk-17.0.2"
export ANDROID_HOME="/c/Users/pigo/Android/Sdk"
cd android && ./gradlew assembleDebug
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

## 方案二：GitHub Actions 云端构建（不需要本地空间）

1. 在 GitHub 创建仓库
2. 推送代码：
```bash
cd /c/Users/pigo/sat-app
git init
git add -A
git commit -m "SAT app with Android support"
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

3. 推送后 GitHub Actions 自动构建 APK
4. 在仓库的 Actions 页面下载 APK 文件

## 方案三：安装 Android Studio 后构建

1. 下载 Android Studio（安装到 D 盘）
2. 打开 `android/` 目录
3. 点击 Build → Build APK

## 获取的 APK 文件

- Debug 版本可以直接安装使用
- 发送给用户时，他们需要在手机设置中允许"安装未知来源应用"
- APK 文件路径：`android/app/build/outputs/apk/debug/app-debug.apk`

## 上架 Google Play

1. 注册 Google Play 开发者账号（$25 一次性费用）
2. 生成签名密钥
3. 构建 Release 版本
4. 在 Google Play Console 上传
