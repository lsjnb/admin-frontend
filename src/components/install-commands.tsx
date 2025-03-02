import { Button, ButtonProps } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import useSettings from "@/hooks/useSetting"
import { copyToClipboard } from "@/lib/utils"
import { ModelProfile, ModelSetting } from "@/types"
import i18next from "i18next"
import { Check, Clipboard } from "lucide-react"
import { forwardRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

enum OSTypes {
    Linux = 1,
    macOS,
    Windows,
    LinuxCN,
    macOSCN,
    WindowsCN,
}

export const InstallCommandsMenu = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const [copy, setCopy] = useState(false)
    const { data: settings } = useSettings()
    const { profile } = useAuth()

    const { t } = useTranslation()

    const switchState = async (type: number) => {
        if (!copy) {
            try {
                setCopy(true)
                if (!profile) throw new Error("Profile is not found.")
                if (!settings?.config) throw new Error("Settings is not found.")
                await copyToClipboard(generateCommand(type, settings!.config, profile) || "")
            } catch (e: Error | any) {
                console.error(e)
                toast(t("Error"), {
                    description: e.message,
                })
            } finally {
                setTimeout(() => {
                    setCopy(false)
                }, 2 * 1000)
            }
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button {...props} ref={ref}>
                    {copy ? <Check /> : <Clipboard />}
                    {t("InstallCommands")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.Linux)
                    }}
                >
                    Linux
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.LinuxCN)
                    }}
                >
                    Linux 国内版
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.macOS)
                    }}
                >
                    macOS
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.macOSCN)
                    }}
                >
                    macOS 国内版
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.Windows)
                    }}
                >
                    Windows
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="nezha-copy"
                    onClick={async () => {
                        switchState(OSTypes.WindowsCN)
                    }}
                >
                    Windows 国内版
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})

const generateCommand = (
    type: number,
    { agent_secret_key, install_host, tls }: ModelSetting,
    { agent_secret, role }: ModelProfile,
) => {
    if (!install_host) throw new Error(i18next.t("Results.InstallHostRequired"))

    // 如果 agent_secret 为空且 role 为 0 ，则使用 agent_secret_key，否则如果 agent_secret 为空则报错
    if (!agent_secret && role === 0) {
        agent_secret = agent_secret_key
    } else if (!agent_secret) {
        throw new Error(i18next.t("Results.AgentSecretRequired"))
    }

    agent_secret_key = agent_secret

    const env = `NZ_SERVER=${install_host} NZ_TLS=${tls || false} NZ_CLIENT_SECRET=${agent_secret_key}`
    const env_win = `$env:NZ_SERVER=\"${install_host}\";$env:NZ_TLS=\"${tls || false}\";$env:NZ_CLIENT_SECRET=\"${agent_secret_key}\";`

    switch (type) {
        case OSTypes.Linux:
        case OSTypes.macOS: {
            let url = "https://raw.githubusercontent.com/lsjnb/scripts/new-world/agent/install.sh";
            return `curl -L ${url} -o agent.sh && chmod +x agent.sh && env ${env} ./agent.sh`
        }
        case OSTypes.LinuxCN:
        case OSTypes.macOSCN: {
            let url = "https://github.geekery.cn/https://raw.githubusercontent.com/lsjnb/scripts/new-world/agent/install.sh";
            return `curl -L ${url} -o agent.sh && chmod +x agent.sh && env ${env} ./agent.sh`
        }
        case OSTypes.Windows: {
            let url = "https://raw.githubusercontent.com/lsjnb/scripts/new-world/agent/install.ps1";
            return `${env_win} [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Ssl3 -bor [Net.SecurityProtocolType]::Tls -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls12;set-ExecutionPolicy RemoteSigned;Invoke-WebRequest ${url} -OutFile C:\install.ps1;powershell.exe C:\install.ps1`
        }
        case OSTypes.WindowsCN: {
            let url = "https://github.geekery.cn/https://raw.githubusercontent.com/lsjnb/scripts/new-world/agent/install.ps1";
            return `${env_win} [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Ssl3 -bor [Net.SecurityProtocolType]::Tls -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls12;set-ExecutionPolicy RemoteSigned;Invoke-WebRequest ${url} -OutFile C:\install.ps1;powershell.exe C:\install.ps1`
        }
        default: {
            throw new Error(`Unknown OS: ${type}`)
        }
    }
}
