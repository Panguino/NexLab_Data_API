# NVM Auto-Switching Setup Guide

## ✅ What's Been Done

A `.nvmrc` file has been created in your project root with:
```
21.7.3
```

This tells nvm which Node version to use for this project.

---

## 🚀 How to Use It

### Option 1: Manual Switching (Always Works)

When you open a terminal in this project directory, run:
```bash
nvm use
```

This will automatically read `.nvmrc` and switch to Node 21.7.3.

### Option 2: Automatic Switching (Recommended)

To make nvm automatically switch when you `cd` into the project, add this to your shell profile:

#### For PowerShell (Windows)

Add this to your PowerShell profile (`$PROFILE`):

```powershell
# Auto-switch Node version based on .nvmrc
function cd {
    Set-Location @args
    if (Test-Path .nvmrc) {
        nvm use
    }
}
```

**To edit your PowerShell profile:**
```powershell
# Open profile in editor
notepad $PROFILE

# Or create if it doesn't exist
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File -Force }
```

#### For Git Bash (Windows)

Add this to your `~/.bashrc` file:

```bash
# Auto-switch Node version based on .nvmrc
cd() {
    builtin cd "$@"
    if [ -f .nvmrc ]; then
        nvm use
    fi
}
```

#### For WSL/Linux/Mac

Add this to your `~/.bashrc` or `~/.zshrc`:

```bash
# Auto-switch Node version based on .nvmrc
cd() {
    builtin cd "$@"
    if [ -f .nvmrc ]; then
        nvm use
    fi
}
```

---

## 🧪 Testing It

### Test Manual Switching

```bash
# Switch to a different Node version
nvm use 20.17.0

# Verify you're on Node 20
node --version
# Output: v20.17.0

# Now switch back using .nvmrc
nvm use

# Verify you're back on Node 21
node --version
# Output: v21.7.3
```

### Test Automatic Switching

After setting up your shell profile:

```bash
# Leave the project directory
cd ..

# Verify you're on a different Node version
node --version
# Output: v20.17.0 (or whatever your default is)

# Enter the project directory
cd NexLab_Data_API

# Verify nvm automatically switched to Node 21
node --version
# Output: v21.7.3
```

---

## 📋 What's in .nvmrc

The `.nvmrc` file is a simple text file with one line:
```
21.7.3
```

You can:
- **Update it** if you want to use a different Node version for this project
- **Commit it** to git so all team members use the same version
- **Share it** with your team

---

## 💡 Benefits

✅ **Project-Specific**: Each project can use a different Node version
✅ **Team Consistency**: Everyone uses the same version
✅ **No Manual Switching**: Automatic when you cd into the project
✅ **Easy Updates**: Just change the version number in `.nvmrc`
✅ **Git Friendly**: Commit to version control

---

## 🔧 Troubleshooting

### "nvm use" not found

Make sure nvm is installed and enabled:
```bash
nvm --version
```

### Automatic switching not working

1. Check your shell profile is set up correctly
2. Restart your terminal
3. Verify `.nvmrc` exists in the project root:
   ```bash
   cat .nvmrc
   ```

### Want to use a different Node version for this project?

1. Install the version:
   ```bash
   nvm install 20
   ```

2. Update `.nvmrc`:
   ```bash
   echo "20.17.0" > .nvmrc
   ```

3. Switch to it:
   ```bash
   nvm use
   ```

---

## ✅ Current Setup

- **Project**: NexLab_Data_API
- **Node Version**: 21.7.3
- **npm Version**: 10.5.0
- **`.nvmrc` File**: ✅ Created and configured

You're all set! 🚀

