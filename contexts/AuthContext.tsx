import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../src/services/apiClient";
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import Router from 'next/router'

type signInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials : signInCredentials) => Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;

}

type AuthProviderProps = {
    children: ReactNode;
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

let authChannel: BroadcastChannel

export function signOut(){
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    authChannel.postMessage('signOut');

    Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({children} : AuthProviderProps){
    const [user, setUser] = useState<User>();

    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = (message) => {
            switch(message.data){
                case 'signOut':
                    signOut();
                    break;
                default: 
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const {'nextauth.token': token} = parseCookies();

        if(token){
            api.get('/me').then(
                response => {
                    const {email, permissions, roles} = response.data;
                    setUser({email, permissions, roles});
                }
            )
            .catch(err => {
                console.log('AuthContext')
                signOut();
            })
        }
    },[])

    async function signIn({email, password} : signInCredentials){
        try{
            const response = await api.post('sessions', {email: email, password: password})

            const { token, refreshToken, permissions, roles } = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorizations'] = `Bearer ${token}`

            Router.push('/dashboard')
        }
        catch(err){
            console.log(err)
        }
    }

    return(
        <AuthContext.Provider value={{signIn, signOut, isAuthenticated, user}}>
            {children}
        </AuthContext.Provider>
    )
}