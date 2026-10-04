'use client';

import { supabase } from '@/lib/supabase'; 
import { Button } from '@/components/ui';

export default function LogoutPage() {
    const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃되었습니다.');
    window.location.href = '/';
    };

    return (
            <div className="mt-8 w-full mb-[60dvh] text-center">
                <Button onClick={handleLogout}>로그아웃</Button>
            </div>

    )
}