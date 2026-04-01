const { prisma } = require('./prisma')

async function log({ action, entity, entityName, userId, userName, clientId, clientName, metadata }) {
  try {
    await prisma.activityLog.create({
      data: { action, entity, entityName: entityName||null, userId: userId||null,
        userName: userName||null, clientId: clientId||null,
        clientName: clientName||null, metadata: metadata||null }
    })
  } catch(e) {
    console.error('ActivityLog error:', e.message)
  }
}

module.exports = { log }