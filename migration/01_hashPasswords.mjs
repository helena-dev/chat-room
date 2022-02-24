import bcrypt from "bcryptjs"
import { createConnection } from 'mysql2/promise'

const saltRounds = 9

if (!process.env.SQL_URL) {
    throw "SQL DB does not exist.\r\n"
}
createConnection(process.env.SQL_URL).then(async (con) => {
    await con.query("LOCK TABLES users WRITE;")
    const [rows, fields] = await con.execute("SELECT id, password FROM users;")
    for (const row of rows) {
        const password = row.password
        const id = row.id
        const hash = bcrypt.hashSync(password, saltRounds);
        await con.execute("UPDATE users SET password = ? WHERE id = ?", [hash, id])
    }
    con.end()
})
