import { ValidationIssue } from "../issues/ValidationIssue";

export class ValidationResult {
    issues: ValidationIssue[] = [];

    issue(issue: ValidationIssue) {
        this.issues.push(issue);
    }

    reset() {
        this.issues = [];
    }

    hasErrors(): boolean {
        return this.issues.length !== 0;
    }

}
