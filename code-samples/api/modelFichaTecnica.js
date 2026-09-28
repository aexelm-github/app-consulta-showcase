require('dotenv').config()
const jwt = require('jsonwebtoken')

let conn = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
    multipleStatements: true,
    dateStrings: true
}

const GET_FICHA = async (ft_codigo, database) => {
    conn.database = database
    const mysql = require('mysql2/promise');
    var json = {}
    const connection = await mysql.createConnection(conn);
    try{
        var SQL = `select * from ficha_tecnica where FT_CODIGO = ?` 
        var [rows, fields] = await connection.execute(SQL, [ ft_codigo ]);

        if (rows.length > 0) {
            json = {
                result : 'success',
                message : 'Datos recuperados exitosamente',
                rows
            };
            await connection.end();
            return json
        }else{
            json = {
                result : 'error',
                message : 'No se recuperaron datos',
                rows: []
            }
            await connection.end();
            return json
        }
    }catch(e){
        json = {
            result : 'error',
            message : e.message,
            rows: []
        }
        await connection.end();
        return json
    }
    
}


const GET_FICHA_RESULT = async (req, res) => {
    console.log("GET_FICHA_RESULT")
    
    // Validar parámetros requeridos
    const { database, ft_codigo } = req.body;
    
    if (!database || !ft_codigo) {
        return res.json({
            result: 'error',
            message: 'Parámetros requeridos: database y ft_codigo',
            valor: null,
            ficha: null,
            superaLimite: false
        });
    }

    conn.database = database;
    const mysql = require('mysql2/promise');
    var json = {};
    const connection = await mysql.createConnection(conn);
    
    try {
        // Obtener la ficha técnica
        const r = await GET_FICHA(ft_codigo, database);
        
        if (r.result !== 'success' || !r.rows || r.rows.length === 0) {
            await connection.end();
            return res.json({
                result: 'error',
                message: 'No se encontró la ficha técnica con el código especificado',
                valor: null,
                ficha: null,
                superaLimite: false
            });
        }

        const ficha = r.rows[0];
        const SQL = ficha.FT_SQL_1;

        if (!SQL) {
            await connection.end();
            return res.json({
                result: 'error',
                message: 'La ficha técnica no tiene SQL configurado (FT_SQL_1)',
                valor: null,
                ficha: ficha,
                superaLimite: false
            });
        }

        // Ejecutar el SQL de la ficha
        var [rows, fields] = await connection.execute(SQL, []);
        
        if (rows.length > 0) {
            const valor = rows[0].valor || 0;
            const limite = parseInt(ficha.FT_VLR_LIMITE) || 0;
            const superaLimite = valor >= limite; // >= en lugar de >
            const PORCENTAJE = limite > 0 ? Math.round((valor / limite) * 100) : 0;

            json = {
                result: 'success',
                message: 'Datos recuperados exitosamente',
                valor: valor,
                ficha: ficha,
                limite: limite,
                superaLimite: superaLimite,
                PORCENTAJE: PORCENTAJE,
                mensajeAlerta: superaLimite ? ficha.MENSAJE : null
            };
            
            console.log("json >>", json);
            await connection.end();
            res.json(json);
        } else {
            json = {
                result: 'error',
                message: 'No se recuperaron datos de la consulta',
                valor: 0,
                ficha: ficha,
                limite: parseInt(ficha.FT_VLR_LIMITE) || 0,
                superaLimite: false,
                PORCENTAJE: 0
            };
            await connection.end();
            res.json(json);
        }
    } catch(e) {
        console.error("Error en GET_FICHA_RESULT:", e);
        json = {
            result: 'error',
            message: e.message || 'Error al procesar la solicitud',
            valor: null,
            ficha: null,
            superaLimite: false
        };
        try {
            await connection.end();
        } catch(closeError) {
            console.error("Error al cerrar conexión:", closeError);
        }
        res.json(json);
    }
}


module.exports = {
    GET_FICHA_RESULT
}