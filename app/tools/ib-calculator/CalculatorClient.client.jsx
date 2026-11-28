'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Notice, Select } from '@/components/ui';
import { DP_PASSING_CRITERIA_URL, IB_SUBJECTS, SUBJECTS_BY_KEY } from '@/data/ib-subjects';
import {
  DEFAULT_BANDS,
  DIPLOMA_MAX_POINTS,
    computeSubjectPercent,
  corePoints,
  diplomaChecks,
  diplomaTotal,
  gradeFromPercent,
  validateBands,
} from '@/lib/ibCalculator';

const STORAGE_KEY = 'ibmaster.ibCalculator.v1';
const ROW_COUNT = 6;
const emptyRow = () => ({ subject: '', level: 'SL', inputs: {}, manualGrade: '' });

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.rows)) return null;
    return data;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore: storage is only a convenience
  }
}

function SubjectRow({ index, row, bands, taken, onChange }) {
  const subject = SUBJECTS_BY_KEY[row.subject];
  const components = subject?.levels?.[row.level] || null;
  const result = useMemo(
    () => (components ? computeSubjectPercent(components, row.inputs) : null),
    [components, row.inputs]
  );
  const estimated = result ? gradeFromPercent(result.percent, bands) : null;

  const setInput = (key, field, value) =>
    onChange({ ...row, inputs: { ...row.inputs, [key]: { ...row.inputs[key], [field]: value } } });

  return (
    <Card padding="sm" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold m-0">과목 {index + 1}</h3>
        {estimated != null && <Badge color="blue">예상 {estimated}점</Badge>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Select
          aria-label={`과목 ${index + 1}`}
          value={row.subject}
          onChange={(e) => onChange({ ...row, subject: e.target.value, inputs: {}, manualGrade: '' })}
          className="col-span-2"
        >
          <option value="">과목 선택</option>
          {IB_SUBJECTS.map((s) => (
            <option key={s.key} value={s.key} disabled={!s.levels || (taken.has(s.key) && s.key !== row.subject)}>
              {s.name}{s.levels ? ` · ${s.edition}` : ' (준비 중)'}
            </option>
          ))}
          <option value="custom">기타 과목 (등급 직접 입력)</option>
        </Select>
        <Select
          aria-label={`과목 ${index + 1} 레벨`}
          value={row.level}
          onChange={(e) => onChange({ ...row, level: e.target.value, inputs: {} })}
        >
          <option value="SL">SL</option>
          <option value="HL">HL</option>
        </Select>
      </div>

      {components && (
        <div className="space-y-2">
          {components.map((c) => {
            const err = result?.errors?.[c.key];
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{c.label}</span>
                  <span className="text-xs text-gray-500">비중 {c.weight}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="내 점수"
                    aria-label={`${c.label} 내 점수`}
                    value={row.inputs[c.key]?.score ?? ''}
                    onChange={(e) => setInput(c.key, 'score', e.target.value)}
                  />
                  <span className="text-gray-400">/</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="만점"
                    aria-label={`${c.label} 만점`}
                    value={row.inputs[c.key]?.max ?? c.max ?? ''}
                    onChange={(e) => setInput(c.key, 'max', e.target.value)}
                  />
                </div>
                {err && <p className="text-xs text-red-600 mt-1 m-0">{err}</p>}
              </div>
            );
          })}
          <p className="text-sm text-gray-600 m-0">
            {result.percent != null
              ? `환산 점수 ${result.percent.toFixed(1)} / 100`
              : '모든 항목의 점수와 만점을 입력하면 계산됩니다.'}
          </p>
          <p className="text-xs text-gray-500 m-0">
            {subject.edition} 교육과정 기준입니다. 만점은 해당 시험지나 채점 기준에 적힌 값을 입력하세요.{' '}
            {subject.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ' · '}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a>
              </span>
            ))}
            {' '}· {subject.lastVerified} 확인
          </p>
        </div>
      )}

      {row.subject === 'custom' && (
        <Select
          aria-label={`과목 ${index + 1} 등급`}
          value={row.manualGrade}
          onChange={(e) => onChange({ ...row, manualGrade: e.target.value })}
        >
          <option value="">등급 선택 (1~7)</option>
          {[7, 6, 5, 4, 3, 2, 1].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
      )}
    </Card>
  );
}

export default function CalculatorClient() {
  const [rows, setRows] = useState(() => Array.from({ length: ROW_COUNT }, emptyRow));
  const [tok, setTok] = useState('');
  const [ee, setEe] = useState('');
  const [bands, setBands] = useState(DEFAULT_BANDS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setRows(Array.from({ length: ROW_COUNT }, (_, i) => ({ ...emptyRow(), ...saved.rows[i] })));
      if (typeof saved.tok === 'string') setTok(saved.tok);
      if (typeof saved.ee === 'string') setEe(saved.ee);
      if (saved.bands && !validateBands(saved.bands)) setBands(saved.bands);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save({ rows, tok, ee, bands });
  }, [ready, rows, tok, ee, bands]);

  const bandsError = validateBands(bands);
  const activeBands = bandsError ? DEFAULT_BANDS : bands;

  const grades = rows.map((row) => {
    if (row.subject === 'custom') return row.manualGrade ? Number(row.manualGrade) : null;
    const components = SUBJECTS_BY_KEY[row.subject]?.levels?.[row.level];
    if (!components) return null;
    return gradeFromPercent(computeSubjectPercent(components, row.inputs).percent, activeBands);
  });
  const coreResult = corePoints(tok, ee);
  const core = coreResult ? coreResult.points : 0;
  const diploma = diplomaTotal(grades, core);
  const checks = diplomaChecks(
    grades.map((grade, i) => ({ grade, level: rows[i].level })),
    core
  );
  // A subject can be chosen once ('기타 과목' may repeat).
  const taken = new Set(rows.map((r) => r.subject).filter((k) => k && k !== 'custom'));

  const updateRow = (i, next) => setRows((prev) => prev.map((r, idx) => (idx === i ? next : r)));
  const reset = () => {
    setRows(Array.from({ length: ROW_COUNT }, emptyRow));
    setTok('');
    setEe('');
    setBands(DEFAULT_BANDS);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-1">IB 성적 계산기</h1>
      <p className="text-sm text-gray-600 mb-4">
        시험과 IA 점수를 입력하면 공식 비중으로 환산해 과목별 예상 등급과 디플로마 총점(45점 만점)을 계산합니다.
      </p>

      <Notice color="yellow" className="mb-4">
        <p className="m-0 font-semibold">예상 등급은 추정치입니다.</p>
        <p className="m-0 mt-1 text-xs">
          IB는 시험 세션마다 등급 구간(grade boundary)을 정하고 이를 공개하지 않습니다. 아래 기본 구간은 공식 값이 아니므로
          참고용으로만 쓰고, 필요하면 직접 수정하세요. 과목 이름 옆에 표시된 시험 연도가 내가 치르는 교육과정과 맞는지
          확인하세요. 목록에 없는 과목은 &quot;기타 과목&quot;으로 등급을 직접 입력해 총점만 계산할 수 있습니다.
        </p>
      </Notice>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <SubjectRow
            key={i}
            index={i}
            row={row}
            bands={activeBands}
            taken={taken}
            onChange={(next) => updateRow(i, next)}
          />
        ))}
      </div>

      <Card padding="sm" className="mt-4 space-y-3">
        <h2 className="text-base font-bold m-0">TOK / EE 코어 점수</h2>
        <div className="grid grid-cols-2 gap-2">
          <Select aria-label="TOK 성적" value={tok} onChange={(e) => setTok(e.target.value)}>
            <option value="">TOK 성적</option>
            {['A', 'B', 'C', 'D', 'E'].map((g) => (
              <option key={g} value={g}>TOK {g}</option>
            ))}
          </Select>
          <Select aria-label="EE 성적" value={ee} onChange={(e) => setEe(e.target.value)}>
            <option value="">EE 성적</option>
            {['A', 'B', 'C', 'D', 'E'].map((g) => (
              <option key={g} value={g}>EE {g}</option>
            ))}
          </Select>
        </div>
        {!coreResult ? (
          <p className="text-sm text-gray-600 m-0">TOK와 EE 성적을 고르면 코어 점수가 계산됩니다.</p>
        ) : coreResult.failing ? (
          <Notice color="red" compact>TOK 또는 EE가 E이면 디플로마를 받을 수 없습니다 (IB의 Failing condition).</Notice>
        ) : (
          <p className="text-sm m-0">코어 점수 <strong>{coreResult.points}점</strong></p>
        )}
        <p className="text-xs text-gray-500 m-0">
          IB의{' '}
          <a href={DP_PASSING_CRITERIA_URL} target="_blank" rel="noopener noreferrer" className="underline">Core points matrix</a>
          를 기준으로 계산합니다.
        </p>
      </Card>

      <Card padding="sm" className="mt-4 space-y-3">
        <h2 className="text-base font-bold m-0">디플로마 총점</h2>
        <p className="text-3xl font-bold m-0">
          {diploma.total}
          <span className="text-base font-medium text-gray-500"> / {DIPLOMA_MAX_POINTS}</span>
        </p>
        {checks ? (
          <ul className="list-none p-0 m-0 space-y-2">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 text-sm">
                <span>{c.label}</span>
                <Badge color={c.ok ? 'green' : 'red'}>{c.ok ? '충족' : '미충족'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600 m-0">6과목의 등급이 모두 정해지면 수여 조건을 확인해 드립니다.</p>
        )}
        <p className="text-xs text-gray-500 m-0">
          CAS 이수, TOK·EE 성적 조건은 학교와 IB가 확인합니다. 전체 조건은{' '}
          <a href={DP_PASSING_CRITERIA_URL} target="_blank" rel="noopener noreferrer" className="underline">IB 공식 안내</a>를 확인하세요.
        </p>
      </Card>

      <Card padding="sm" className="mt-4 space-y-3">
        <h2 className="text-base font-bold m-0">등급 구간 설정 (추정치)</h2>
        <p className="text-xs text-gray-500 m-0">각 등급의 최소 환산 점수(%)입니다.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[7, 6, 5, 4, 3, 2].map((g) => (
            <label key={g} className="text-xs text-gray-600">
              {g}점 이상
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={bands[g]}
                onChange={(e) => setBands({ ...bands, [g]: e.target.value })}
                className="mt-1"
              />
            </label>
          ))}
        </div>
        {bandsError && <p className="text-xs text-red-600 m-0">{bandsError} 기본 구간으로 계산 중입니다.</p>}
        <Button variant="secondary" size="sm" onClick={() => setBands(DEFAULT_BANDS)}>기본 구간으로 되돌리기</Button>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={reset}>모두 지우기</Button>
      </div>
    </div>
  );
}
