/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Dropzone from 'react-dropzone'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/auth'
import { useAlert } from '../contexts/alert'
import { useLoading } from '../contexts/loading'
import api, { STORAGE_URL } from '../services/api'
import inputValidation from '../utils/inputValidation'
import { Button, Header, Input, EmptyMessage } from '../components'

type UserProps = {
  name: string
  email: string
  phone: string
  avatar: string
  is_oauth_user: boolean
}

const Account: React.FC = () => {
  const auth = useAuth()
  const alert = useAlert()
  const { startLoading, stopLoading } = useLoading()
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: `${STORAGE_URL}/user/default-avatar.png`
  })

  async function getUser() {
    startLoading()

    await api
      .get<UserProps>('/user')
      .then(res => {
        setUser({
          ...res.data,
          avatar: res.data.is_oauth_user
            ? res.data.avatar
            : `${STORAGE_URL}/user/${res.data.avatar}`
        })
      })
      .catch(err => {
        const type = err.response.status >= 500 ? 'error' : 'warning'
        const title = 'Algo deu errado :('
        const message = err.response?.data.description
        alert.show(type, title, message)
        if (process.env.NODE_ENV !== 'production') {
          console.log(err)
        }
      })

    stopLoading()
  }

  function onChange(type: string, value: string) {
    setUser({ ...user, [type]: value })
  }

  async function saveData(e) {
    e.preventDefault()

    const data = {
      name: user.name,
      phone: user.phone
    }

    startLoading()

    await api
      .put('/user', data)
      .then(() => {
        const type = 'success'
        const title = 'Deu tudo certo :D'
        const message = 'Seus dados foram salvos com sucesso.'
        alert.show(type, title, message)
      })
      .catch(err => {
        const type = err.response.status >= 500 ? 'error' : 'warning'
        const title = 'Algo deu errado :('
        const message = err.response?.data.description
        alert.show(type, title, message)
        if (process.env.NODE_ENV !== 'production') {
          console.log(err)
        }
      })

    stopLoading()
  }

  async function updateAvatar(image) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }

    const data = new FormData()

    data.append('file', image)

    setUser({
      ...user,
      avatar: URL.createObjectURL(image)
    })

    await api.put('/user/avatar', data, config).catch(err => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(err)
      }
    })
  }

  useEffect(() => {
    if (auth.signed) {
      getUser()
    }
  }, [auth.signed])

  return (
    <div>
      <Head>
        <title>Minha conta</title>
      </Head>

      <main className="account-page">
        <Header />

        {!auth.signed ? (
          <EmptyMessage
            icon={faUserAlt}
            title="Você ainda não está logado em uma conta!"
            description="Faça o login no aplicativo para poder acessar os dados da sua conta."
            buttonText="Entrar"
            redirectTo="/login"
          />
        ) : (
          <div className="account">
            <h1>Minha conta</h1>

            <div className="user-info">
              <Dropzone
                onDrop={acceptedFiles => updateAvatar(acceptedFiles[0])}
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <img src={user.avatar} alt="Avatar" />
                  </div>
                )}
              </Dropzone>
              <p>{user.name}</p>
              <Button onClick={() => auth.signOut()}>Sair</Button>
            </div>

            <form onSubmit={saveData}>
              <Input
                type="text"
                labelInside="Nome"
                placeholder="Ex: Alexander Augusto"
                value={user.name}
                onChange={e => onChange('name', e.target.value)}
              />
              <Input
                type="email"
                labelInside="E-mail"
                placeholder="Ex: alexander@locus.com"
                value={user.email}
                onChange={e => onChange('email', e.target.value)}
              />
              <Input
                type="text"
                labelInside="Celular"
                placeholder="(xx) xxxxx-xxxx"
                value={user.phone}
                onChange={e =>
                  onChange('phone', inputValidation.phone(e.target.value))
                }
              />
              <Button type="submit">Salvar</Button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default Account
