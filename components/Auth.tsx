
import React, { useState, useEffect } from 'react';
// Added missing Loader2 to the imports
import { User as UserIcon, Lock, Eye, EyeOff, UserPlus, LogIn, AlertCircle, Trash2, ShieldCheck, Database, Loader2 } from 'lucide-react';
import { User } from '../types';

const LOCAL_USERS_KEY = 'hierarchy_on_device_users';

// Defined AuthProps interface to fix "Cannot find name 'AuthProps'"
interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('saved_username');
    if (savedId) {
      setUsername(savedId);
      setRememberId(true);
    }
  }, []);

  const handleResetSystem = () => {
    if (confirm('모든 로컬 설정, 계정, 프로젝트 데이터를 영구적으로 삭제하시겠습니까? 이 작업은 절대 되돌릴 수 없습니다.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const getLocalUsers = (): any[] => {
    try {
      const data = localStorage.getItem(LOCAL_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalUsers = (users: any[]) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 인공적인 딜레이 (UI 피드백용)
    await new Promise(r => setTimeout(r, 600));

    const users = getLocalUsers();

    if (isLogin) {
      // 로그인 처리
      const foundUser = users.find(u => u.username === cleanUsername && u.password === cleanPassword);
      if (foundUser) {
        finalizeLogin(cleanUsername);
      } else {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } else {
      // 회원가입 처리
      if (users.find(u => u.username === cleanUsername)) {
        setError('이미 사용 중인 아이디입니다.');
      } else {
        const updatedUsers = [...users, { username: cleanUsername, password: cleanPassword }];
        saveLocalUsers(updatedUsers);
        alert('이 기기에 회원가입이 완료되었습니다. 이제 로그인해주세요.');
        setIsLogin(true);
        setPassword('');
      }
    }
    setIsSubmitting(false);
  };

  const finalizeLogin = (un: string) => {
    if (rememberId) {
      localStorage.setItem('saved_username', un);
    } else {
      localStorage.removeItem('saved_username');
    }
    onLogin({ username: un });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden transition-colors duration-500">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-4 shadow-inner">
              {isLogin ? <LogIn className="text-white w-8 h-8" /> : <UserPlus className="text-white w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Hierarchy Pro</h1>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Database className="w-3 h-3 text-emerald-400" />
              <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">
                Secure On-Device Storage
              </p>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-shake flex items-start gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local ID</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="아이디"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="비밀번호"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border-2 border-slate-200 rounded-md peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-all"></div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">아이디 저장</span>
              </label>
              
              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                <ShieldCheck className="w-3 h-3" />
                No Cloud Sync
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  기기 로그인
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  기기 회원가입
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline underline-offset-4"
            >
              {isLogin ? '계정이 없으신가요? 기기에 등록하기' : '이미 등록된 계정이 있나요? 로그인'}
            </button>
            
            <button 
              onClick={handleResetSystem}
              className="text-[9px] font-black text-slate-300 hover:text-red-400 transition-colors uppercase tracking-[0.2em] mt-4"
            >
              Factory Reset Device Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
