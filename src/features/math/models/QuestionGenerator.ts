import { randomInt, shuffle } from '@/utils';
import { Question } from '../types';

type Operation = '+' | '-' | '×';

type DistractorContext = {
  a: number;
  b: number;
  answer: number;
  operation: Operation;
  difficulty: number;
};

export class QuestionGenerator {
  generate(difficulty: number): Question {
    switch (difficulty) {
      case 1:
        return this.generateDifficulty1();

      case 2:
        return this.generateDifficulty2();

      case 3:
        return this.generateDifficulty3();

      case 4:
        return this.generateDifficulty4();

      default:
        return this.generateDifficulty1();
    }
  }

  private generateDifficulty1(): Question {
    const useAddition = Math.random() < 0.5;

    let a = randomInt(1, 20);
    let b = randomInt(1, 20);

    let answer: number;
    let expression: string;
    let operation: Operation;

    if (useAddition) {
      operation = '+';
      answer = a + b;
      expression = `${a} + ${b}`;
    } else {
      operation = '-';

      if (a < b) {
        [a, b] = [b, a];
      }

      answer = a - b;
      expression = `${a} - ${b}`;
    }

    return this.createQuestion({
      a,
      b,
      answer,
      operation,
      difficulty: 1,
      expression,
    });
  }

  private generateDifficulty2(): Question {
    const useAddition = Math.random() < 0.5;

    let a = randomInt(1, 50);
    let b = randomInt(1, 50);

    let answer: number;
    let expression: string;
    let operation: Operation;

    if (useAddition) {
      operation = '+';
      answer = a + b;
      expression = `${a} + ${b}`;
    } else {
      operation = '-';

      if (a < b) {
        [a, b] = [b, a];
      }

      answer = a - b;
      expression = `${a} - ${b}`;
    }

    return this.createQuestion({
      a,
      b,
      answer,
      operation,
      difficulty: 2,
      expression,
    });
  }

  private generateDifficulty3(): Question {
    const operationIndex = randomInt(0, 2);

    let a: number;
    let b: number;
    let answer: number;
    let expression: string;
    let operation: Operation;

    switch (operationIndex) {
      case 0:
        operation = '+';

        a = randomInt(1, 100);
        b = randomInt(1, 100);

        answer = a + b;
        expression = `${a} + ${b}`;
        break;

      case 1:
        operation = '-';

        a = randomInt(1, 100);
        b = randomInt(1, 100);

        if (a < b) {
          [a, b] = [b, a];
        }

        answer = a - b;
        expression = `${a} - ${b}`;
        break;

      default:
        operation = '×';

        a = randomInt(2, 12);
        b = randomInt(2, 12);

        answer = a * b;
        expression = `${a} × ${b}`;
        break;
    }

    return this.createQuestion({
      a,
      b,
      answer,
      operation,
      difficulty: 3,
      expression,
    });
  }

  private generateDifficulty4(): Question {
    const operationIndex = randomInt(0, 2);

    let a: number;
    let b: number;
    let answer: number;
    let expression: string;
    let operation: Operation;

    switch (operationIndex) {
      case 0:
        operation = '+';

        a = randomInt(1, 200);
        b = randomInt(1, 200);

        answer = a + b;
        expression = `${a} + ${b}`;
        break;

      case 1:
        operation = '-';

        a = randomInt(1, 200);
        b = randomInt(1, 200);

        if (a < b) {
          [a, b] = [b, a];
        }

        answer = a - b;
        expression = `${a} - ${b}`;
        break;

      default:
        operation = '×';

        a = randomInt(5, 20);
        b = randomInt(2, 15);

        answer = a * b;
        expression = `${a} × ${b}`;
        break;
    }

    return this.createQuestion({
      a,
      b,
      answer,
      operation,
      difficulty: 4,
      expression,
    });
  }

  private createQuestion({
    a,
    b,
    answer,
    operation,
    difficulty,
    expression,
  }: DistractorContext & { expression: string }): Question {
    return {
      expression,
      answer,
      options: this.generateOptions({
        a,
        b,
        answer,
        operation,
        difficulty,
      }),
      difficulty,
    };
  }

  private generateOptions(context: DistractorContext): number[] {
    const { answer, difficulty } = context;

    const options = new Set<number>();

    options.add(answer);

    const candidates = this.generateDistractorCandidates(context);

    for (const candidate of shuffle(candidates)) {
      if (candidate >= 0 && candidate !== answer) {
        options.add(candidate);
      }

      if (options.size === 4) {
        break;
      }
    }

    // Fallback để đảm bảo luôn có đủ 4 options.
    while (options.size < 4) {
      const offset = randomInt(-10, 10);

      if (offset === 0) {
        continue;
      }

      const candidate = answer + offset;

      if (candidate >= 0) {
        options.add(candidate);
      }
    }

    return shuffle([...options]);
  }

  private generateDistractorCandidates(context: DistractorContext): number[] {
    const { a, b, answer, operation, difficulty } = context;

    switch (difficulty) {
      case 1:
        return [
          answer - 1,
          answer + 1,
          answer - 2,
          answer + 2,
          answer - 3,
          answer + 3,
        ];

      case 2:
        return [
          answer - 1,
          answer + 1,
          answer - 2,
          answer + 2,
          answer - 3,
          answer + 3,
          answer - 5,
          answer + 5,
        ];

      case 3:
        return this.generateHardDistractors(a, b, answer, operation);

      case 4:
        return this.generateExpertDistractors(a, b, answer, operation);

      default:
        return [answer - 1, answer + 1, answer - 2, answer + 2];
    }
  }

  private generateHardDistractors(
    a: number,
    b: number,
    answer: number,
    operation: Operation,
  ): number[] {
    switch (operation) {
      case '+':
        return [
          a + (b - 1),
          a - 1 + b,
          a + (b + 1),
          a + 1 + b,
          a + (b - 2),
          a - 2 + b,
        ];

      case '-':
        return [
          a - (b - 1),
          a - 1 - b,
          a - (b + 1),
          a + 1 - b,
          a - (b - 2),
          a - 2 - b,
        ];

      case '×':
        return [
          (a - 1) * b,
          (a + 1) * b,
          a * (b - 1),
          a * (b + 1),
          (a - 2) * b,
          a * (b - 2),
        ];

      default:
        return [answer - 1, answer + 1, answer - 2, answer + 2];
    }
  }

  private generateExpertDistractors(
    a: number,
    b: number,
    answer: number,
    operation: Operation,
  ): number[] {
    const candidates: number[] = [];

    switch (operation) {
      case '+':
        candidates.push(
          a + (b - 1),
          a - 1 + b,
          a + (b + 1),
          a + 1 + b,
          a + (b - 10),
          a - 10 + b,
          a + (b + 10),
          a + 10 + b,
        );
        break;

      case '-':
        candidates.push(
          a - (b - 1),
          a - 1 - b,
          a - (b + 1),
          a + 1 - b,
          a - (b - 10),
          a - 10 - b,
          a - (b + 10),
          a + 10 - b,
        );
        break;

      case '×':
        candidates.push(
          (a - 1) * b,
          (a + 1) * b,
          a * (b - 1),
          a * (b + 1),
          (a - 2) * b,
          (a + 2) * b,
          a * (b - 2),
          a * (b + 2),
        );
        break;
    }

    // Thêm một số kết quả gần đáp án để tránh pattern quá dễ.
    candidates.push(
      answer - 1,
      answer + 1,
      answer - 2,
      answer + 2,
      answer - 3,
      answer + 3,
    );

    return candidates;
  }
}
