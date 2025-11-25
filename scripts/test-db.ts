import { prisma } from '../lib/prisma'

async function main() {
    try {
        console.log('🔌 Conectando a la base de datos...')
        const userCount = await prisma.user.count()
        console.log(`✅ Conexión exitosa!`)
        console.log(`📊 Cantidad de usuarios en la DB: ${userCount}`)
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
