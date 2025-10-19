import { auth } from './server/auth';
import type { Session, User } from 'better-auth';

export const getSessionFromToken = async(token: string): Promise<{session: Session, user: User} | null> => {
  try {
    const _session = await auth.api.getSession({
      headers: { 'Authorization': `Bearer ${token}`}
    });
    if(_session){
      const session = _session.session as Session;
      const user = _session.user as User;
      return {session, user};
    }
    // return null;
    return null;
  }
  catch (error) {
    console.error('Error verifying token:', error);
  }

  return null;
};

export const verifyToken = async(token: string): Promise<boolean> => {
  try {
    const _session = await auth.api.getSession({
      headers: { 'Authorization': `Bearer ${token}`}
    });
    if(_session){
      return true;
    }
    // return null;
    return false;
  }
  catch (error) {
    console.error('Error verifying token:', error);
  } 
};

export const verifySession = async(session: Session): Promise<boolean> => {
  try {
    const _session = await auth.api.getSession({
      headers: { 'Authorization': `Bearer ${session.token}`}
    });
    if(_session){
      return true;
    }
    // return null;
    return false;
  }
  catch (error) {
    console.error('Error verifying token:', error);     
    return false;
  }
};

export const signInUsername = async(username: string, password: string): Promise<{token: string, user: User} | null> => {
  try {
    const _session = await auth.api.signInUsername({
      body:{
        username,
        password,
      }});
    if(_session){
      const token = _session.token; 
      const user = _session.user as User;
      return {token, user};
    }
    // return null;
    return null;
  }
  catch (error) {
    console.error('Error signing in:', error);
  }
  return null;
};   