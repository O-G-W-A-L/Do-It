import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  username: yup.string().required(),
  password: yup.string().required(),
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const { login, error } = useAuth();

  const onSubmit = data => login(data.username, data.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
      <form onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Log In</h2>
        {error && <div className="text-red-600">{error}</div>}

        <div className="flex flex-col">
          <label className="mb-1">Username</label>
          <input {...register('username')}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <span className="text-red-500 text-sm">{errors.username?.message}</span>
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Password</label>
          <input type="password" {...register('password')}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <span className="text-red-500 text-sm">{errors.password?.message}</span>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Log In
        </button>
      </form>
    </div>
  );
}
