# Claude Code Safety Rules

## CRITICAL: Dangerous Commands to NEVER Execute

### System-Level Destructive Commands
```bash
# NEVER run these commands
rm -rf /
rm -rf /*
rm -rf ~
sudo rm -rf /
mkfs.*
dd if=/dev/zero of=/dev/sda
:(){ :|:& };:  # Fork bomb
chmod -R 000 /
```

### File System Destruction
```bash
# Avoid these patterns
rm -rf [any system directory]
shred -vfz -n 10 [important files]
> /dev/sda  # Wipe disk
find / -delete
```

### Network Security Risks
```bash
# Be cautious with these
curl | bash  # Executing remote scripts
wget -O- | sh  # Same risk
nc -l [port]  # Opening network listeners
ssh-keygen without user approval
```

### System Configuration Changes
```bash
# Require explicit user approval
sudo passwd  # Changing passwords
usermod -a -G sudo [user]  # Adding sudo privileges
crontab -e  # Modifying scheduled tasks
systemctl disable [critical-service]
```

### Package Management Risks
```bash
# Be careful with
sudo apt-get remove --purge [system-packages]
npm install -g [unknown-packages]
pip install [from untrusted sources]
```

## Safe Practices

### Before Any Destructive Operation
1. Always confirm with user first
2. Show exactly what will be affected
3. Suggest safer alternatives when possible
4. Use --dry-run or --preview flags when available

### File Operations
- Use `ls -la` to verify targets before deletion
- Prefer `mv` to trash instead of `rm` when possible
- Always use relative paths within project directory
- Backup important files before major changes

### Network Operations
- Only connect to user-specified URLs/IPs
- Avoid downloading and executing scripts directly
- Use package managers instead of curl | bash

### System Commands
- Avoid sudo unless absolutely necessary
- Never modify system-wide configurations without approval
- Stay within project boundaries
- Use virtual environments for development

## Command Validation Checklist

Before executing any command, ask:
1. Does this affect files outside the project directory?
2. Does this require root/admin privileges?
3. Could this damage the system or delete important data?
4. Is this reversible?
5. Did the user explicitly request this specific action?

## Emergency Stop
If you accidentally start a dangerous command:
- Use Ctrl+C to interrupt
- Use `kill -9 [PID]` if needed
- Immediately inform the user of what happened

## Project-Safe Commands
These are generally safe within the project directory:
```bash
# File operations (within project)
ls, cat, head, tail, find, grep
mkdir, touch, cp, mv (within project)
git commands (add, commit, push, pull, status, diff)

# Development tools
npm run [scripts], yarn, pnpm
python, node, go run
make, cmake
docker build/run (with proper flags)

# Safe system info
ps, top, df, du, whoami, pwd, which
```

Remember: When in doubt, ask the user for confirmation before executing any command that could affect the system beyond the current project directory.