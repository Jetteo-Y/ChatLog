---
name: readme-optimizer
description: Automatically update README.md with accepted project optimizations. Use this skill whenever a project optimization is made and accepted, to ensure it's documented in the README.md file. This skill helps maintain up-to-date project documentation and track the evolution of the project.
compatibility:
  required_tools:
    - Read
    - Edit
    - Write
---

# README Optimizer Skill

This skill helps maintain up-to-date project documentation by automatically updating the README.md file with accepted project optimizations. It ensures that all significant changes and improvements are properly documented, making it easier for team members and future contributors to understand the project's evolution.

## When to Use This Skill

Use this skill whenever:
- A project optimization is made and accepted
- A new feature is implemented
- A bug fix is completed
- Any significant change that should be documented in the README.md

## How It Works

1. **Detect Optimization**: Identify the optimization that has been made and accepted
2. **Analyze README.md**: Read the current README.md file to understand its structure
3. **Update Documentation**: Add the optimization details to the appropriate section of README.md
4. **Maintain Consistency**: Ensure the update follows the existing documentation style

## Process

### Step 1: Identify the Optimization

Determine what optimization has been made, including:
- What was changed
- Why it was changed
- How it improves the project
- When it was implemented

### Step 2: Read the Current README.md

Use the Read tool to get the current content of README.md. Pay attention to:
- Existing sections
- Documentation style
- How previous optimizations were documented
- Any specific format requirements

### Step 3: Determine Update Strategy

Based on the README.md structure, decide where to add the optimization information:
- If there's an "Optimizations" or "Changelog" section, add it there
- If not, consider creating a new section
- Ensure the update fits with the existing documentation style

### Step 4: Update README.md

Use the Edit tool to update README.md with the optimization details. Include:
- A clear title for the optimization
- A brief description of what was changed
- The benefits of the change
- Any relevant technical details
- The date of implementation

### Step 5: Verify the Update

Ensure the update:
- Follows the existing documentation style
- Is clear and concise
- Provides enough information for others to understand the optimization
- Doesn't break any existing formatting

## Example Format

```markdown
### Recent Optimizations

#### [Optimization Title] (YYYY-MM-DD)
- **Change**: Brief description of what was changed
- **Benefit**: How this improves the project
- **Technical Details**: Relevant technical information (if applicable)
```

## Important Guidelines

1. **Only Document Accepted Optimizations**: Do not document optimizations that were rejected or not implemented
2. **Be Specific**: Provide clear and specific information about each optimization
3. **Maintain Consistency**: Follow the existing documentation style and structure
4. **Keep It Concise**: Focus on the most important details without being overly verbose
5. **Update Regularly**: Document optimizations as they are accepted, not after multiple changes

## Edge Cases

- **Multiple Optimizations**: If multiple optimizations are made at once, document each separately
- **Major Changes**: For major changes, consider creating a dedicated section
- **No README.md**: If there's no README.md, create one with basic project information and add the optimization details
- **Complex README.md**: For complex README.md files with multiple sections, ensure the optimization is added to the appropriate section

## Troubleshooting

- **Formatting Issues**: If the update breaks the README.md formatting, revert and try again with careful attention to formatting
- **Section Placement**: If unsure where to add the optimization, look for similar content or create a new section
- **Content Overlap**: If the optimization is similar to previous ones, ensure it's clearly differentiated

## Tools Required

- **Read**: To read the current README.md file
- **Edit**: To update the README.md file
- **Write**: To create a README.md file if it doesn't exist