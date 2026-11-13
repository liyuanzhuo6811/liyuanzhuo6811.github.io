require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
require(["vs/editor/editor.main"], () => {
    if ($("div#code").length) {
        monaco.editor.create(document.getElementById('code'), {
            language: 'cpp',
            theme: 'vs-dark',
        });
        $("div#code").after('<div id="issues"></div>')
        monaco.editor.getEditors()[0].onDidChangeModelContent(() => {
            let code = monaco.editor.getEditors()[0].getValue();
            $("#issues").children().remove();
            function issue(message) {
                $("#issues").append(`<li>${message}</li>`);
            }
            function lineNumberByIndex(index, string) {
                const re = /^[\S\s].*/gm;
                let line = 0, match;
                let lastRowIndex = 0;
                let lastMatch;
                while ((match = re.exec(string))) {
                    if (match.index > index) break;
                    lastRowIndex = match.index;
                    lastMatch = match;
                    line++;
                }
                return [Math.max(line - 1, 0), lastRowIndex, lastMatch[0]];
            }
    
            const findOccurrences = (needle, haystack) => {
                let match;
                const result = [];
                while ((match = needle.exec(haystack))) {
                const pos = lineNumberByIndex(needle.lastIndex, haystack);
                    result.push({
                        match,
                        lineNumber: pos[0],
                        column: needle.lastIndex - pos[1] - match[0].length,
                        line: pos[2]
                    });
                }
                return result;
            };
    
            const findIssue = (pattern, code, message) => {
                findOccurrences(pattern, code).forEach((result) => {
                    issue(`at line ${result.lineNumber + 1} col ${result.column + 1} - ${result.line.replace(
                        result.match[0], '<span style="color: red;">' + result.match[0] + '</span>'
                    )} ${message}`);
                });
            };
            findIssue(/bits(\/|\\)stdc\+\+\.h/g, code, "有万能头文件")
            findIssue(/scanf|printf/g, code, "用C语言的格式，用 scanf 或者/和 printf 来读输入输出")
            findIssue(/cin/g, code, "用cin，大部分都用cin")
            findIssue(/freopen/g, code, "如果用fin，如果用c++，用的就是freopen，不是ifstream")
            findIssue(/main/g, code, "全部程序都在main里面，只有万不得已，才会写方法（函数）")
            findIssue(/(int|char|double|float|long long)\s+[abc](\s*,\s*[abc]);*/gm, code, "命名一定是a，b，c")
            findIssue(/(?<!typedef )(int|char|double|float|long long)\s+(.+,)*\s*\w+\s*(,.+)*;/gm, code, "变量一定不会初始化")
            findIssue(/(int|char|double|float|long long)\s+(.+,)*\s*\w+\[\w+\]\s*(,.+)*;/gm, code, "数据结构一定用的是静态数组而不是动态数组")
            findIssue(/((if|while|for)\s+\(.+\).+;$)/gm, code, "能不加大括号，就不加")
        });
    }
});