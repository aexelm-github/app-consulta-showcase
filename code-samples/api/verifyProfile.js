require('dotenv').config();
const jwtoken = require('./jwtoken');

const conn = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
    multipleStatements: true,
    dateStrings: true
};

const ROUTE_TO_RECURSO = {
    PERFILES: 'perfiles',
    OBJETOS: 'objetos',
    OBJETOS_UI: 'objetos',
    PERFIL_OBJETOS: 'perfiles',
    USER_PERMISSIONS: '*',
    SAVE_PERFIL: 'perfiles',
    DELETE_PERFIL: 'perfiles',
    SET_PERFIL_OBJETOS: 'perfiles',
    IMAGES: '*',
    USUARIOS: 'usuarios',
    SAVE_USUARIO: 'usuarios',
    DELETE_USUARIO: 'usuarios',
    REPLACE_WORKAREA: '*',
    DELETE_WORKAREA: '*'
};

const checkPermission = async (usu_id, ruta, recurso) => {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection(conn);
    try {
        const [userRows] = await connection.execute(
            `SELECT usu_perfil FROM usuarios WHERE usu_id = ?`,
            [usu_id]
        );
        if (!userRows.length) return false;
        const perfil = userRows[0].usu_perfil;

        let oac_obj = null;
        const mappedRecurso = ROUTE_TO_RECURSO[recurso?.toUpperCase()] || recurso?.toLowerCase() || '*';
        const [accRows] = await connection.execute(
            `SELECT oac_obj_nombre FROM objeto_accion 
             WHERE oac_ruta = ? AND (oac_recurso = ? OR oac_recurso = '*')
             ORDER BY oac_recurso DESC LIMIT 1`,
            [ruta, mappedRecurso]
        );
        if (accRows.length) {
            oac_obj = accRows[0].oac_obj_nombre;
        } else {
            const [accWildcard] = await connection.execute(
                `SELECT oac_obj_nombre FROM objeto_accion 
                 WHERE oac_ruta = ? AND oac_recurso = '*'
                 LIMIT 1`,
                [ruta]
            );
            oac_obj = accWildcard.length ? accWildcard[0].oac_obj_nombre : null;
        }
        if (!oac_obj) return true;

        const [permRows] = await connection.execute(
            `SELECT 1 FROM perfiles_objeto 
             WHERE pobj_per_nom_perfil = ? AND pobj_obj_nombre = ?
             LIMIT 1`,
            [perfil, oac_obj]
        );
        return permRows.length > 0;
    } finally {
        await connection.end();
    }
};

const verifyProfile = (ruta) => async (req, res, next) => {
    try {
        const { authData } = await jwtoken.jwtVerify(req.token);
        if (!authData?.usu_id) {
            return res.json({
                result: 'error',
                message: 'Token inválido o sin usuario'
            });
        }

        // Usuario master: bypass total de permisos
        if (authData?.email && authData.email.toLowerCase() === process.env.MASTER_USER_EMAIL) {
            req.authData = authData;
            return next();
        }

        const recurso = (req.body?.recurso || req.params?.route || '*').toUpperCase();
        const allowed = await checkPermission(authData.usu_id, ruta, recurso);
        if (!allowed) {
            return res.json({
                result: 'error',
                message: 'No tiene permiso para realizar esta acción'
            });
        }
        req.authData = authData;
        next();
    } catch (e) {
        res.json({
            result: 'error',
            message: e.message || 'Error al validar permisos'
        });
    }
};

module.exports = {
    checkPermission,
    verifyProfile
};
