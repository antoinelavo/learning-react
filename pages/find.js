import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TeacherCard from "@/components/TeacherCard";

export default function FindPage() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "approved");

      if (error) {
        console.error("Error loading teachers:", error);
      } else {
        setTeachers(data);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">과외 선생님 찾기</h1>
      <div className="space-y-5">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </main>
  );
}