// backend/database/setup-railway.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupRailwayDatabase() {
    console.log('🚂 Configurando base de datos en Railway...');
    
    // Crear conexión sin especificar base de datos primero
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Verificar si la base de datos existe
        const [rows] = await connection.execute('SHOW DATABASES');
        const databases = rows.map(row => row.Database);
        
        if (!databases.includes(process.env.DB_NAME)) {
            console.log(`📦 Creando base de datos ${process.env.DB_NAME}...`);
            await connection.execute(`CREATE DATABASE ${process.env.DB_NAME} 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci`);
            console.log('✅ Base de datos creada.');
        } else {
            console.log(`✅ Base de datos ${process.env.DB_NAME} ya existe.`);
        }

        // Usar la base de datos
        await connection.execute(`USE ${process.env.DB_NAME}`);

        // Crear tabla tasks
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tasks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createTableSQL);
        console.log('✅ Tabla "tasks" creada/verificada.');

        // Insertar datos de prueba
        const sampleTasks = [
            'Configurar Railway MySQL',
            'Desplegar backend en la nube',
            'Conectar React con API remota',
            'Probar aplicación en producción'
        ];

        for (const title of sampleTasks) {
            const [existing] = await connection.execute(
                'SELECT id FROM tasks WHERE title = ?',
                [title]
            );
            
            if (existing.length === 0) {
                await connection.execute(
                    'INSERT INTO tasks (title) VALUES (?)',
                    [title]
                );
            }
        }

        console.log('✅ Datos de prueba insertados.');
        
        // Mostrar estadísticas
        const [taskCount] = await connection.execute('SELECT COUNT(*) as count FROM tasks');
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log('\n📊 ESTADÍSTICAS:');
        console.log(`   Base de datos: ${process.env.DB_NAME}`);
        console.log(`   Tablas: ${tables.length}`);
        console.log(`   Tareas: ${taskCount[0].count}`);
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    } catch (error) {
        console.error('❌ Error durante el setup:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupRailwayDatabase()
        .then(() => {
            console.log('\n🎉 Setup completado exitosamente!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Error en el setup:', error.message);
            process.exit(1);
        });
}

module.exports = setupRailwayDatabase;