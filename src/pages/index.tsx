import { GetServerSideProps } from 'next';
import { FormEvent, useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Home.module.scss'
import { parseCookies } from 'nookies'

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, isAuthenticated } = useContext(AuthContext)

  function handleSubmit(event: FormEvent){
    event.preventDefault();
    const data = {
      email,
      password
    }

    signIn(data)
  }

  return (
    <form className={styles.container} onSubmit={e => handleSubmit(e)}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}/>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
      <button type="submit"> Submit </button>
    </form>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = parseCookies(ctx);

  if(cookies['nextauth.token']){
    return{
      redirect:{
        destination: '/dashboard',
        permanent: false
      }
    }
  }

  return{
    props:{}
  }
}