import { describe, expect, it } from 'vitest';
import {
  isAnswerMatch,
  normalizeAnswer,
  singularize,
  splitVariants,
} from './answerNormalizer';

describe('normalizeAnswer', () => {
  it('убирает регистр, кавычки и лишние пробелы', () => {
    expect(normalizeAnswer('  «Лев»  ')).toBe('лев');
  });

  it('приводит ё к е', () => {
    expect(normalizeAnswer('ёж')).toBe('еж');
  });

  it('переживает пустое значение', () => {
    expect(normalizeAnswer(undefined)).toBe('');
  });
});

describe('splitVariants', () => {
  it('делит варианты по слэшу', () => {
    expect(splitVariants('лев/львы')).toEqual(['лев', 'львы']);
  });

  it('убирает пустые варианты', () => {
    expect(splitVariants('лев/')).toEqual(['лев']);
  });
});

describe('singularize', () => {
  it('снимает английское окончание s', () => {
    expect(singularize('lions')).toBe('lion');
  });

  it('не трогает русские слова', () => {
    expect(singularize('львы')).toBe('львы');
  });
});

describe('isAnswerMatch', () => {
  it('игнорирует регистр и пробелы', () => {
    expect(isAnswerMatch('  ЛЕВ ', 'лев')).toBe(true);
  });

  it('принимает вариант, указанный в карточке', () => {
    expect(isAnswerMatch('львы', 'лев/львы')).toBe(true);
  });

  it('принимает английское множественное число', () => {
    expect(isAnswerMatch('lions', 'lion')).toBe(true);
  });

  it('допускает одну опечатку в длинном слове', () => {
    expect(isAnswerMatch('elephent', 'elephant')).toBe(true);
  });

  it('не допускает опечатку в коротком слове', () => {
    expect(isAnswerMatch('cag', 'cat')).toBe(false);
  });

  it('отклоняет неверный ответ', () => {
    expect(isAnswerMatch('волк', 'лев')).toBe(false);
  });

  it('пустой ответ не подходит', () => {
    expect(isAnswerMatch('   ', 'лев')).toBe(false);
  });
});
