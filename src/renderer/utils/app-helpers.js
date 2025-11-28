import { stripQuotesStr, splitPath } from './format'

export async function chooseFile(inputPathRef, outputFolderRef, outputFilenameRef) {
    if (!window.electronAPI) return
    try {
        const p = await window.electronAPI.openFile()
        if (p) {
            inputPathRef.value = p
            const sp = splitPath(p)
            if (sp.folder && !outputFolderRef.value) outputFolderRef.value = sp.folder
            outputFilenameRef.value = `${sp.name}_out`
        }
    } catch (e) { }
}

export async function chooseOutputFolder(outputFolderRef) {
    if (!window.electronAPI || !window.electronAPI.openDirectory) return
    try {
        const p = await window.electronAPI.openDirectory()
        if (p) outputFolderRef.value = p
    } catch (e) { }
}

export function parseOutputFolderInput(outputFolderRef, outputFilenameRef) {
    let v = stripQuotesStr(outputFolderRef.value || '')
    if (!v) return
    outputFolderRef.value = v
    const sp = splitPath(v)
    if (sp.hasExt) {
        if (sp.folder) outputFolderRef.value = sp.folder
        outputFilenameRef.value = sp.name
    }
}

export function parseInputPathInput(inputPathRef, outputFolderRef, outputFilenameRef) {
    const vRaw = stripQuotesStr(inputPathRef.value)
    if (!vRaw) return
    inputPathRef.value = vRaw
    const sp = splitPath(vRaw)
    if (sp.folder && !outputFolderRef.value) outputFolderRef.value = sp.folder
    outputFilenameRef.value = `${sp.name}_out`
}

export async function chooseInfoFile(infoFileRef) {
    if (!window.electronAPI) return
    try {
        const p = await window.electronAPI.openFile()
        if (p) infoFileRef.value = p
    } catch (e) { }
}

export function parseInfoFileInput(infoFileRef) {
    const v = stripQuotesStr(infoFileRef.value)
    if (!v) return
    infoFileRef.value = v
}
