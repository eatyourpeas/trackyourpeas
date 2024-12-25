export const markdownSummary = (endTime: string, elapsedTime: string, repoName: string | null, branchName:string | null, is_addition:boolean): string => {
    /*
    Function to generate a markdown summary of the tracking session.
    It takes the elapsed time, repository name, and branch name as arguments.
    It returns a string in markdown format.
    If there is an existing summary, it appends the new summary to the existing one.
    The summary includes:
    - Date and time submitted
     - Session start time
    - Session end time
    - Session duration
    - Repository name
    - Branch name
    */

    // Get the start time of the session from the elapsed time and end time
    const endTimeMs = new Date(endTime).getTime();
    const elapsedTimeMs = parseInt(elapsedTime) * 1000;
    const startTimeMs = endTimeMs - elapsedTimeMs;
    const startTime = new Date(startTimeMs);


    const now = new Date();
    const date = now.toDateString();
    const time = now.toLocaleTimeString();
    const title = `## Summary
| Date       | Time       | Session Start Time | Session End Time | Session Duration | Repository | Branch     |`;
    const summaryRowDivider = ` |------------|------------|--------------------|------------------|------------------|------------|------------|`
    const summaryRow = `| ${date}    | ${time}    | ${startTime}       | ${endTime}       | ${elapsedTime}   | ${repoName || 'N/A'}| ${branchName || 'N/A'} |`;

    let summary = '';
    if (is_addition){
        summary = summaryRowDivider + '\n' + summaryRow + '\n';
    } else{
        summary = title + '\n' + summaryRowDivider + '\n' + summaryRow + '\n';
    }

    return summary;
}