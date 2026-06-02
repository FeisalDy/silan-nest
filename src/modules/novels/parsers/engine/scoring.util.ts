export class ScoreAccumulator {
  private score = 0;

  add(points: number): this {
    this.score += points;
    return this;
  }

  addIf(condition: boolean, points: number): this {
    if (condition) {
      this.score += points;
    }
    return this;
  }

  addIfAll(conditions: boolean[], points: number): this {
    if (conditions.every(Boolean)) {
      this.score += points;
    }
    return this;
  }

  addIfAny(conditions: boolean[], points: number): this {
    if (conditions.some(Boolean)) {
      this.score += points;
    }
    return this;
  }

  total(): number {
    return this.score;
  }
}

export const scoreWith = (build: (score: ScoreAccumulator) => void): number => {
  const scorer = new ScoreAccumulator();
  build(scorer);
  return scorer.total();
};

