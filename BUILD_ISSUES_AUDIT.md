# 🔍 Build Hanging/Failing - Complete Audit

## Problems Found:

### 1. ❌ **NO CODE SIGNING IDENTITIES**
```bash
$ security find-identity -v -p codesigning
     0 valid identities found
```
**Issue:** No Apple Developer certificates installed, but project requires signing

### 2. ❌ **CODE_SIGN_IDENTITY Set for Physical Devices**
```
"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
```
**Issue:** This requires a development team and certificates

### 3. ❌ **DEVELOPMENT_TEAM Missing**
```bash
$ grep DEVELOPMENT_TEAM project.pbxproj
(no results)
```
**Issue:** Required when CODE_SIGN_IDENTITY is set

### 4. ❌ **Entitlements Require Signing**
```xml
com.apple.developer.associated-domains: ["applinks:glintz.travel"]
```
**Issue:** Associated domains entitlement requires valid signing even for simulator in some cases

### 5. ❌ **Expo CLI Treating Simulator as Device**
```bash
$ npx expo run:ios -d "iPhone 17 Pro"
› Using --device 29EA592D-E43B-42E8-9DF0-A79868503E96
CommandError: No code signing certificates are available to use.
```
**Issue:** The `-d` flag triggers device code signing checks

---

## Root Cause:

The Xcode project is configured for **PHYSICAL DEVICE DEPLOYMENT** which requires:
- Apple Developer Account
- Code Signing Certificates
- Provisioning Profiles
- Development Team ID

For **SIMULATOR-ONLY** builds, we need to:
- Set `CODE_SIGN_IDENTITY` to empty for simulator SDK
- Use automatic signing style
- Not require development team for Debug builds on simulator

---

## Solutions:

### Option A: **Fix Xcode Project for Simulator** (Recommended)
Modify `project.pbxproj` to not require signing for simulator builds

### Option B: **Use Expo Dev Client**
Start Metro bundler separately and install pre-built dev client

### Option C: **Build via Xcode IDE**
Open in Xcode and let it auto-configure signing

---

## Why It Hangs:

1. Expo CLI detects code signing requirements
2. Tries to find valid certificates
3. Finds none (0 valid identities)
4. Either hangs waiting for user input or fails immediately
5. The `-d` flag makes it worse by treating simulator as device

---

## Next Steps:

Need to choose approach and fix the Xcode configuration.
