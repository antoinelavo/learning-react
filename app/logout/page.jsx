'use client';

import { supabase } from '@/lib/supabase'; 

export default function LogoutPage() {
    const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃되었습니다.');
    window.location.href = '/';
    };

    return (
            <div className="mt-8 w-full mb-[60dvh] text-center">
                <button onClick={handleLogout} className="bg-blue-500 text-white px-[2em] py-[1em] rounded-lg">로그아웃</button>
            </div>

    )
}