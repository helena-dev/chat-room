import Markdown from "markdown-to-jsx"
import React from "react"
import { parse } from "tldts";

export interface CustomMarkdownProps {
    text: string;
}

export const CustomMarkdown = ({ text }: CustomMarkdownProps) => {

    const MessageLink: React.FC = ({ children, ...props }) => {
        return (
            <a {...props} target="_blank" rel="noreferrer">{children}</a>
        )
    }

    const tryURL = (child: string, matches: RegExpMatchArray[]) => {
        return child.split(" ").map((word, i) => {
            try {
                const url = new URL(`http://${word}`)
                const parsedUrl = parse(url.hostname)
                if (!(parsedUrl.isIcann && parsedUrl.domainWithoutSuffix)) throw new Error("Invalid TLD")
                return <>
                    <a href={url.href} target="_blank" rel="noreferrer">{word}</a>
                    {(matches.length && matches[i]) ? <span>{matches[i][0]}</span> : undefined}
                </>
            } catch {
                const trailing = (matches.length && matches[i]) ? matches[i][0] : ""
                return word + trailing
            }
        })
    }
    const parseString = (
        childList: React.ReactChild[] | (string & any[]) | (number & any[]) |
            (React.ReactElement<any, string | React.JSXElementConstructor<any>> & any[]),
        type: string | React.FunctionComponent<{}> | React.ComponentClass<{}, any>,
        props: any
    ) => {
        return childList.map((child) => {
            if (typeof child == "string") {
                const re = new RegExp('( +)', 'g')
                const matches = [...child.matchAll(re)]
                return React.createElement(type, props, tryURL(child, matches))
            }
            else { return child }
        })
    }
    return (
        <Markdown options={{
            disableParsingRawHTML: true,
            forceInline: true,
            overrides : {
                a : MessageLink
            },
            createElement(type, props, children) {
                if (!(type && props && children)) return <></>
                if (!["a", "img"].includes(type.toString())) {
                    const childList = Array.isArray(children) ? children : [children]
                    return React.createElement(type, props, parseString(childList, type, props))
                }
                return React.createElement(type, props, children)
            },
        }}>
            {text}
        </Markdown>
    )
}