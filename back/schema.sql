CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    
    totp_secret VARCHAR(32),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT,  -- JSON string de códigos hasheados
    
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    reset_token VARCHAR(64),
    reset_token_expires TIMESTAMP,
    
    role VARCHAR(50) DEFAULT 'user',
    permissions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE routers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    uri VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_routers_branches 
        FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE router_secrets (
    id SERIAL PRIMARY KEY,
    router_id INT NOT NULL,
    ip_address VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    comment VARCHAR(255),
    profile VARCHAR(255),
    contract VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_router_secrets_routers 
        FOREIGN KEY (router_id) REFERENCES routers(id)
);

CREATE TABLE router_firewall (
    router_id INT NOT NULL,
    firewall_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(20) NOT NULL,
    comment VARCHAR(255),
    creation_date VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (router_id, firewall_id),
    CONSTRAINT fk_router_firewall_routers 
        FOREIGN KEY (router_id) REFERENCES routers(id)
);

CREATE TABLE router_secret_configs (
    router_id INT NOT NULL,
    secret_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    comment VARCHAR(255),
    profile VARCHAR(255),
    profile_value VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (router_id, secret_id),
    CONSTRAINT fk_router_secret_configs_routers 
        FOREIGN KEY (router_id) REFERENCES routers(id)
);

CREATE TABLE user_routers (
    user_id INT NOT NULL,
    router_id INT NOT NULL,
    access_level VARCHAR(20) DEFAULT 'read',
    is_group_member BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT,
    PRIMARY KEY (user_id, router_id),
    CONSTRAINT fk_user_routers_users 
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_routers_routers 
        FOREIGN KEY (router_id) REFERENCES routers(id),
    CONSTRAINT fk_user_routers_granted_by 
        FOREIGN KEY (granted_by) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    router_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_routers 
        FOREIGN KEY (router_id) REFERENCES routers(id),
    CONSTRAINT fk_activity_logs_users 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE auth_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    username VARCHAR(80),
    email VARCHAR(120),
    
    event_type VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(200),
    
    ip_address VARCHAR(45),  -- IPv6 compatible
    user_agent TEXT,
    session_id VARCHAR(128),
    
    two_factor_used BOOLEAN DEFAULT FALSE,
    backup_code_used BOOLEAN DEFAULT FALSE,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_auth_logs_users 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    user_id INT,
    event_type VARCHAR(50) NOT NULL,  -- account_locked, password_changed, etc.
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- low, medium, high, critical
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_security_events_users 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear índices para mejorar el rendimiento
-- Índices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Índices para sistema de red
CREATE INDEX idx_routers_branch ON routers(branch_id);
CREATE INDEX idx_routers_is_active ON routers(is_active);
CREATE INDEX idx_router_secrets_router ON router_secrets(router_id);
CREATE INDEX idx_router_secrets_ip ON router_secrets(ip_address);
CREATE INDEX idx_user_routers_user ON user_routers(user_id);
CREATE INDEX idx_user_routers_router ON user_routers(router_id);
CREATE INDEX idx_activity_logs_router ON activity_logs(router_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Índices para logs de seguridad
CREATE INDEX idx_auth_logs_timestamp ON auth_logs(timestamp);
CREATE INDEX idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_ip ON auth_logs(ip_address);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routers_updated_at
    BEFORE UPDATE ON routers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar las tablas
COMMENT ON TABLE users IS 'Tabla principal de usuarios con autenticación 2FA, seguridad y permisos';
COMMENT ON TABLE branches IS 'Tabla que almacena las sucursales/oficinas de la organización';
COMMENT ON TABLE routers IS 'Tabla que almacena la información de los routers por sucursal';
COMMENT ON TABLE router_secrets IS 'Tabla que almacena los secrets de configuración de los routers';
COMMENT ON TABLE router_firewall IS 'Tabla que almacena la configuración de firewall de los routers';
COMMENT ON TABLE router_secret_configs IS 'Tabla que almacena configuraciones específicas de secrets por router';
COMMENT ON TABLE user_routers IS 'Tabla que relaciona usuarios con routers y define niveles de acceso';
COMMENT ON TABLE activity_logs IS 'Tabla que almacena el registro de actividades del sistema de red';
COMMENT ON TABLE auth_logs IS 'Tabla que almacena logs de eventos de autenticación';
COMMENT ON TABLE security_events IS 'Tabla que almacena eventos de seguridad críticos';

-- Comentarios para campos nuevos en users
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin, supervisor, operator, user, guest, manager, etc.';
COMMENT ON COLUMN users.permissions IS 'Permisos específicos y acceso a módulos en formato JSON';
COMMENT ON COLUMN users.totp_secret IS 'Secreto TOTP para autenticación de dos factores';
COMMENT ON COLUMN users.two_factor_enabled IS 'Indica si el usuario tiene habilitado 2FA';
COMMENT ON COLUMN users.backup_codes IS 'Códigos de respaldo para 2FA (JSON hasheado)';
COMMENT ON COLUMN users.failed_login_attempts IS 'Número de intentos de login fallidos';
COMMENT ON COLUMN users.locked_until IS 'Fecha hasta la cual la cuenta está bloqueada';

INSERT INTO users (username, email, password_hash, role, is_active) VALUES ('Ariels', 'ascastro875@gmail.com', '$2b$12$z7J9zGVkWfY09ih3rJfD7eDfjEcCjCfAZtXvT.yExD8xQuKqP9K7m', 'admin', TRUE);
    -- Hash de contraseña de ejemplo (password = "toor123")

INSERT INTO branches (name, location) VALUES ('Ibarra', 'Azaya'); 

INSERT INTO routers (name, uri, username, password, branch_id, is_active, created_at, updated_at) 
VALUES ('Router Principal', '45.70.15.234', 'ariels875', 'Hell&Back875', 1, true, NOW(), NOW());
