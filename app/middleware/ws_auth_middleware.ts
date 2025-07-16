import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'
import env from '#start/env'
import { TeamRepository } from '../repositories/team_repository.js'

interface WsUser {
  id: string
  role: string
  name: string
  teamMembers: string[]
}

export async function wsAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const teamRepository = new TeamRepository()
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization

  if (!token) {
    return next(new Error('Authentication error: Token not provided'))
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, env.get('JWT_SECRET'))
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'))
  }

  try {
    let teamMembers: string[] = []
    
    if (decoded.role === 'minero') {
      const team = await teamRepository.findTeamByMineroId(decoded.userId)
      if (team) {
        teamMembers = team.mineros.map((miner: { mineroId: string }) => miner.mineroId)
        socket.join(`team:${team.id}`)
        for (const minerId of teamMembers) {
          socket.join(`minero:${minerId}`)
        }
      }
    } else if (decoded.role === 'supervisor') {
      const teams = await teamRepository.findTeamsBySupervisorId(decoded.userId)
      for (const team of teams) {
        socket.join(`team:${team.id}`)
        for (const teamMiner of team.mineros) {
          socket.join(`minero:${teamMiner.mineroId}`)
        }
      }
    }

    socket.data.user = {
      id: decoded.userId,
      role: decoded.role,
      name: decoded.name,
      teamMembers
    } as WsUser
    
    next()
  } catch (error) {
    console.error('Error subscribing to team channels:', error)
    next(error as Error)
  }
}
