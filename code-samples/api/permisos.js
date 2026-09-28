require('dotenv').config();
const mysql = require('mysql2/promise');

const conn = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
    multipleStatements: true,
    dateStrings: true,
};

/**
 * validaPermiso: retorna true/false si el usuario puede ejecutar la acción indicada
 * @param {object} authData - viene del JWT (req.authData)
 * @param {string} menu     - nombre del MENU, ej. 'CONSULTAR'
 * @param {string} screen   - nombre del SCREEN, ej. 'WORKAREACHILD'
 * @param {string} permiso  - nombre lógico del permiso, ej. 'CONSULTAR_WORKAREA'
 */
const validaPermiso = async (authData, menu, screen, permiso) => {
    if (!authData?.usu_id) return false;

    const connection = await mysql.createConnection(conn);
    try {
        // 1. Obtener perfil del usuario
        const [userRows] = await connection.execute(
            `SELECT usu_perfil FROM usuarios WHERE usu_id = ?`,
            [authData.usu_id]
        );
        if (!userRows.length) return false;
        const perfil = userRows[0].usu_perfil;

        // 2. Verificar jerarquía MENU -> SCREEN -> PERMISO y permiso asignado al perfil
        const [rows] = await connection.execute(
            `
            SELECT 1
            FROM objetos perm
            JOIN objetos scr  ON scr.obj_nombre  = perm.obj_parent AND scr.obj_type  = 'SCREEN'
            JOIN objetos men  ON men.obj_nombre  = scr.obj_parent  AND men.obj_type  = 'MENU'
            JOIN perfiles_objeto po ON po.pobj_obj_nombre = perm.obj_nombre AND po.pobj_per_nom_perfil = ?
            WHERE men.obj_nombre = ? AND scr.obj_nombre = ? AND perm.obj_nombre = ?
            LIMIT 1
            `,
            [perfil, menu, screen, permiso]
        );

        return rows.length > 0;
    } finally {
        await connection.end();
    }
};

module.exports = {
    validaPermiso,
};

