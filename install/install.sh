#!/usr/bin/env bash

# =============================================================================
# Kinboard LXC Install Script
# Repository: https://github.com/tyrongower/Kinboard.git
# Branch: main
#
# Usage:
#   Fresh install:  sudo bash kinboard-install.sh
#   Update:         sudo bash kinboard-install.sh --update
#   Force update:   sudo bash kinboard-install.sh --force-update
# =============================================================================

set -euo pipefail

# Configuration
REPO_URL="https://github.com/tyrongower/Kinboard.git"
BRANCH="main"
INSTALL_DIR="/opt/kinboard"
BACKEND_BUILD_DIR="/opt/kinboard-backend"
LOG_FILE="/var/log/kinboard-update.log"
SCRIPT_NAME="kinboard-install.sh"
SCRIPT_PATH="/opt/$SCRIPT_NAME"

# User-configurable settings (set during first install)
FRONTEND_PORT="3000"
BACKEND_PORT="5000"
API_URL=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Prompt user for configuration values (first install only)
prompt_configuration() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Kinboard Configuration${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # Prompt for backend port
    read -p "Enter backend API port [default: 5000]: " input_backend_port
    if [[ -n "$input_backend_port" ]]; then
        BACKEND_PORT="$input_backend_port"
    fi

    # Prompt for frontend port
    read -p "Enter frontend port [default: 3000]: " input_frontend_port
    if [[ -n "$input_frontend_port" ]]; then
        FRONTEND_PORT="$input_frontend_port"
    fi

    # Determine default API URL based on backend port and machine IP
    local machine_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [[ -n "$machine_ip" ]]; then
        local default_api_url="http://${machine_ip}:${BACKEND_PORT}"
    else
        local default_api_url="http://localhost:${BACKEND_PORT}"
    fi
    read -p "Enter API URL [default: $default_api_url]: " input_api_url
    if [[ -n "$input_api_url" ]]; then
        API_URL="$input_api_url"
    else
        API_URL="$default_api_url"
    fi

    echo ""
    log_info "Configuration:"
    echo -e "  Backend Port:  ${GREEN}${BACKEND_PORT}${NC}"
    echo -e "  Frontend Port: ${GREEN}${FRONTEND_PORT}${NC}"
    echo -e "  API URL:       ${GREEN}${API_URL}${NC}"
    echo ""
}

# Check if already installed
is_installed() {
    [[ -d "$INSTALL_DIR" ]] && [[ -d "$BACKEND_BUILD_DIR" ]]
}

# Get current local commit hash
get_local_commit() {
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        git -C "$INSTALL_DIR" rev-parse HEAD 2>/dev/null || echo "none"
    else
        echo "none"
    fi
}

# Get remote commit hash
get_remote_commit() {
    git ls-remote "$REPO_URL" "refs/heads/$BRANCH" 2>/dev/null | cut -f1 || echo "none"
}

# Check if update is available
update_available() {
    local local_commit=$(get_local_commit)
    local remote_commit=$(get_remote_commit)

    if [[ "$local_commit" == "none" ]] || [[ "$remote_commit" == "none" ]]; then
        return 1
    fi

    [[ "$local_commit" != "$remote_commit" ]]
}

# Install system dependencies
install_dependencies() {
    log_info "Updating package lists..."
    apt-get update -qq

    log_info "Installing system dependencies..."
    apt-get install -y -qq \
        curl \
        wget \
        git \
        ca-certificates \
        gnupg \
        cron \
        > /dev/null 2>&1

    log_success "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        log_info "Node.js $node_version already installed"
        return
    fi

    log_info "Installing Node.js 22.x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
    log_success "Installed Node.js $(node -v)"
}

# Install .NET SDK
install_dotnet() {
    if command -v dotnet &> /dev/null; then
        local dotnet_version=$(dotnet --version)
        log_info ".NET SDK $dotnet_version already installed"
        return
    fi

    log_info "Installing .NET 9 SDK..."
    wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
    dpkg -i /tmp/packages-microsoft-prod.deb > /dev/null 2>&1
    rm /tmp/packages-microsoft-prod.deb
    apt-get update -qq
    apt-get install -y -qq dotnet-sdk-9.0 > /dev/null 2>&1
    log_success "Installed .NET $(dotnet --version)"
}

# Clone or update repository
clone_or_update_repo() {
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log_info "Updating repository..."
        cd "$INSTALL_DIR"
        git fetch origin "$BRANCH" --quiet
        git reset --hard "origin/$BRANCH" --quiet
        log_success "Repository updated"
    else
        log_info "Cloning repository..."
        rm -rf "$INSTALL_DIR"
        git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" --quiet
        log_success "Repository cloned"
    fi
}

# Build backend
build_backend() {
    log_info "Building backend..."
    cd "$INSTALL_DIR/backend/Kinboard.Api"
    dotnet restore --verbosity quiet
    dotnet publish -c Release -o "$BACKEND_BUILD_DIR" --verbosity quiet
    log_success "Backend built"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    cd "$INSTALL_DIR/frontend"

    # Create production environment file only if it doesn't exist
    if [[ ! -f "$INSTALL_DIR/frontend/.env.production" ]]; then
        cat <<EOF > "$INSTALL_DIR/frontend/.env.production"
NEXT_PUBLIC_API_URL=${API_URL}
EOF
        log_info "Created .env.production with API_URL: ${API_URL}"
    else
        log_info "Preserving existing .env.production file"
    fi

    npm ci --silent > /dev/null 2>&1
    npm run build --silent > /dev/null 2>&1
    log_success "Frontend built"
}

# Create systemd services
create_services() {
    log_info "Creating systemd services..."

    # Backend service
    cat <<EOF > /etc/systemd/system/kinboard-backend.service
[Unit]
Description=Kinboard Backend API
After=network.target

[Service]
Type=simple
WorkingDirectory=$BACKEND_BUILD_DIR
ExecStart=/usr/bin/dotnet $BACKEND_BUILD_DIR/Kinboard.Api.dll --urls=http://0.0.0.0:${BACKEND_PORT}
Restart=always
RestartSec=10
Environment=DOTNET_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat <<EOF > /etc/systemd/system/kinboard-frontend.service
[Unit]
Description=Kinboard Frontend
After=network.target kinboard-backend.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/npm start -- -p ${FRONTEND_PORT} -H 0.0.0.0
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    log_success "Systemd services created"
}

# Start services
start_services() {
    log_info "Starting services..."
    systemctl enable --now kinboard-backend > /dev/null 2>&1
    systemctl enable --now kinboard-frontend > /dev/null 2>&1
    log_success "Services started"
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    systemctl restart kinboard-backend kinboard-frontend
    log_success "Services restarted"
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    apt-get -y autoremove -qq > /dev/null 2>&1
    apt-get -y autoclean -qq > /dev/null 2>&1
    log_success "Cleanup complete"
}

# Fresh install
do_install() {
    log_info "Starting fresh installation..."

    # Prompt for configuration on first install
    prompt_configuration

    install_dependencies
    install_nodejs
    install_dotnet
    clone_or_update_repo
    build_backend
    build_frontend
    create_services
    start_services
    cleanup

    echo ""
    log_success "Installation completed successfully!"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Kinboard is now running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  Frontend: ${BLUE}http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}${NC}"
    echo -e "  Backend:  ${BLUE}http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}${NC}"
    echo -e "  API URL:  ${BLUE}${API_URL}${NC}"
    echo ""
    echo -e "  Auto-update is enabled (checks every 6 hours)"
    echo -e "  Logs: ${LOG_FILE}"
    echo ""
}

# Update existing installation
do_update() {
    local force=${1:-false}

    if ! is_installed; then
        log_error "No existing installation found. Run without --update for fresh install."
        exit 1
    fi

    local local_commit=$(get_local_commit)
    local remote_commit=$(get_remote_commit)

    if [[ "$force" != "true" ]] && [[ "$local_commit" == "$remote_commit" ]]; then
        log_info "Already up to date (${local_commit:0:8})"
        exit 0
    fi

    log_info "Updating from ${local_commit:0:8} to ${remote_commit:0:8}..."

    clone_or_update_repo
    build_backend
    build_frontend
    restart_services

    log_success "Update completed successfully!"
}

# Main
main() {
    check_root

    case "${1:-}" in
        --update)
            do_update false
            ;;
        --force-update)
            do_update true
            ;;
        --check)
            if update_available; then
                echo "Update available"
                exit 0
            else
                echo "No update available"
                exit 1
            fi
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (none)          Fresh install"
            echo "  --update        Update if newer version available"
            echo "  --force-update  Force rebuild even if up to date"
            echo "  --check         Check if update is available (exit 0=yes, 1=no)"
            echo "  --help          Show this help"
            exit 0
            ;;
        "")
            if is_installed; then
                log_warn "Existing installation detected."
                read -p "Reinstall? This will overwrite existing installation. (y/N): " confirm
                if [[ "$confirm" != [yY] ]]; then
                    log_info "Use --update to update existing installation"
                    exit 0
                fi
            fi
            do_install
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

main "$@"
