// backend/database/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        console.log('🔧 Configurando conexión a MySQL en Railway...');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Puerto: ${process.env.DB_PORT}`);
        console.log(`   Base de datos: ${process.env.DB_NAME}`);
        
        // Configuración para Railway
        const sslConfig = process.env.DB_SSL === 'true' 
            ? {
                ssl: {
                    rejectUnauthorized: false // IMPORTANTE para Railway
                }
            }
            : {};
        
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'railway',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            timezone: process.env.DB_TIMEZONE || '+00:00',
            charset: 'utf8mb4',
            ...sslConfig,
            // Configuraciones adicionales para Railway
            connectTimeout: 10000, // 10 segundos timeout
            acquireTimeout: 10000, // 10 segundos para adquirir conexión
        });

        this.testConnection();
    }

    async testConnection() {
        try {
            console.log('🔄 Probando conexión a Railway MySQL...');
            const connection = await this.pool.getConnection();
            console.log('✅ Conexión a Railway MySQL exitosa!');
            
            // Verificar si la base de datos existe
            const [databases] = await connection.query("SHOW DATABASES");
            console.log('📊 Bases de datos disponibles:', databases.map(db => db.Database));
            
            // Verificar si la tabla existe
            const [tables] = await connection.query("SHOW TABLES");
            console.log('📋 Tablas en la base de datos:', tables.map(table => Object.values(table)[0]));
            
            if (tables.length === 0 || !tables.some(table => Object.values(table)[0] === 'tasks')) {
                console.log('⚠️  La tabla "tasks" no existe. Creándola...');
                await this.createTable();
            } else {
                console.log('✅ Tabla "tasks" encontrada.');
            }
            
            connection.release();
        } catch (error) {
            console.error('❌ ERROR al conectar con Railway MySQL:');
            console.error('   Código:', error.code);
            console.error('   Mensaje:', error.message);
            console.error('   SQL State:', error.sqlState);
            
            console.error('\n💡 SOLUCIÓN PARA RAILWAY:');
            console.error('   1. Verifica que la URL de conexión sea correcta');
            console.error('   2. Asegúrate de que la base de datos esté activa en Railway');
            console.error('   3. Verifica que el puerto 45138 esté abierto');
            console.error('   4. Revisa las credenciales en .env');
            console.error('   5. Verifica que puedas conectar manualmente:');
            console.error('      mysql -h gondola.proxy.rlwy.net -P 45138 -u root -p');
            
            process.exit(1);
        }
    }

    async createTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS tasks (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(255) NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;
            
            await this.pool.execute(sql);
            console.log('✅ Tabla "tasks" creada exitosamente en Railway.');
            
            // Insertar datos de prueba
            await this.insertSampleData();
        } catch (error) {
            console.error('❌ Error al crear tabla en Railway:', error.message);
        }
    }

    async insertSampleData() {
        try {
            const sampleTasks = [
                'Aprender a desplegar en Railway',
                'Configurar MySQL en la nube',
                'Crear API REST con Express',
                'Conectar React con backend remoto'
            ];
            
            for (const title of sampleTasks) {
                const [existing] = await this.pool.execute(
                    'SELECT id FROM tasks WHERE title = ?',
                    [title]
                );
                
                if (existing.length === 0) {
                    await this.pool.execute(
                        'INSERT INTO tasks (title) VALUES (?)',
                        [title]
                    );
                }
            }
            
            console.log('✅ Datos de prueba insertados en Railway.');
        } catch (error) {
            console.error('❌ Error al insertar datos de prueba:', error.message);
        }
    }

    // Métodos para ejecutar consultas
    async query(sql, params = []) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('❌ Error en consulta SQL:');
            console.error('   SQL:', sql);
            console.error('   Parámetros:', params);
            console.error('   Error:', error.message);
            throw error;
        }
    }

    async getOne(sql, params = []) {
        const results = await this.query(sql, params);
        return results[0] || null;
    }
}

// Exportar una única instancia
const database = new Database();
module.exports = database;