import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  username:  yup.string().required().min(3),
  email:     yup.string().email('Must be valid').required(),
  password1: yup.string().required().min(8),
  password2: yup.string()
    .oneOf([yup.ref('password1')], 'Passwords must match').required(),
});

export default function RegisterPage() {
  const { register: reg, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const { signup, error, infoMessage } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async data => {
    setSubmitting(true);
    await signup(data.username, data.email, data.password1, data.password2);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
      <form onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>

        {error && <div className="text-red-600">{error}</div>}
        {infoMessage && <div className="text-green-600">{infoMessage}</div>}

        {['username','email','password1','password2'].map((f, i) => (
          <div key={i} className="flex flex-col">
            <label className="mb-1 capitalize">
              {f.replace('1','').replace('2','')}
            </label>
            <input
              type={f.includes('password') ? 'password' : 'text'}
              {...reg(f)}
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-red-500 text-sm">{errors[f]?.message}</span>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
    </div>
  );
}
