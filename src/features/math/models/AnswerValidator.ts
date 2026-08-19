import { Question } from '../types';

export class AnswerValidator {
	validate(question: Question, answer: number): boolean {
		return question.answer === answer;
	}
}
