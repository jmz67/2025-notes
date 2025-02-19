import React, { useCallback, useEffect, useState } from 'react'  
// 引入 React 和相关 hooks

import { useTranslation } from 'react-i18next'  
// 用于多语言翻译

import Link from 'next/link'  
// 用于 Next.js 的链接组件

import { useRouter, useSearchParams } from 'next/navigation'  
// Next.js 路由相关功能

import { RiContractLine, RiDoorLockLine, RiErrorWarningFill } from '@remixicon/react'  
// 引入图标组件

import Loading from '../components/base/loading'  
// 引入 Loading 组件

import MailAndCodeAuth from './components/mail-and-code-auth'  
// 引入邮箱验证码登录组件

import MailAndPasswordAuth from './components/mail-and-password-auth'  
// 引入邮箱密码登录组件

import SocialAuth from './components/social-auth'  
// 引入社交账号登录组件

import SSOAuth from './components/sso-auth'  
// 引入单点登录（SSO）组件

import cn from '@/utils/classnames'  
// 引入动态类名工具

import { getSystemFeatures, invitationCheck } from '@/service/common'  
// 引入获取系统功能和邀请验证的服务

import { LicenseStatus, defaultSystemFeatures } from '@/types/feature'  
// 引入许可证状态和默认系统功能

import Toast from '@/app/components/base/toast'  
// 引入 Toast 消息组件

import { IS_CE_EDITION } from '@/config'  
// 引入是否为企业版的配置

const NormalForm = () => {
    // 登录表单组件

    const { t } = useTranslation() // 获取翻译功能
    const router = useRouter() // 获取路由实例
    const searchParams = useSearchParams() // 获取 URL 中的查询参数

    // 从 URL 查询参数中获取相关值，并进行解码
    const consoleToken = decodeURIComponent(searchParams.get('access_token') || '')
    const refreshToken = decodeURIComponent(searchParams.get('refresh_token') || '')
    const message = decodeURIComponent(searchParams.get('message') || '')
    const invite_token = decodeURIComponent(searchParams.get('invite_token') || '')

    // 定义 UI 的一些状态
    const [isLoading, setIsLoading] = useState(true)
    // 控制加载状态
    const [systemFeatures, setSystemFeatures] = useState(defaultSystemFeatures) 
    // 存储系统功能配置
    const [authType, updateAuthType] = useState<'code' | 'password'>('password')
    // 控制当前的控制方式
    const [showORLine, setShowORLine] = useState(false)  
    // 控制是否显示 OR 分隔线
    const [allMethodsAreDisabled, setAllMethodsAreDisabled] = useState(false)  
    // 控制是否禁用所有认证方法
    const [workspaceName, setWorkSpaceName] = useState('')  
    // 存储工作区名称

    // 判断是否为邀请链接
    const isInviteLink = Boolean(invite_token && invite_token !== 'null')

    // 初始化函数
    const init = useCallback(async () => {
        // 使用 useCallback 确保函数不在每次渲染的时候都重新定义
        try {
            // 如果 URL 中包含 access_token 和 refresh_token 则直接存储并跳转
            if (consoleToken && refreshToken) {
                localStorage.setItem('console_token', consoleToken)
                // 保存 console_token 到 localStorage
                localStorage.setItem('refresh_token', refreshToken)
                // 保存 refresh_token 到 localStorage
                router.replace('/apps') // 重定向到 /apps 页面
                return 
            }

            // 如果 URL 中包含 message，显示错误提示
            if (message) {
                Toast.notify({
                    type: 'error',
                    message,
                })
            }

            // 获取系统功能配置
            const features = await getSystemFeatures()

            const allFeatures = { ...defaultSystemFeatures, ...features}
            // 合并默认功能和获取到的功能

            setSystemFeatures(allFeatures)
            // 更新系统功能状态

            // 判断是否禁用所有认证方法
            setAllMethodsAreDisabled(!allFeatures.enable_social_oauth_login && !allFeatures.enable_email_code_login && !allFeatures.enable_email_password_login && !allFeatures.sso_enforced_for_signin)
            // 判断是否显示 OR 分隔线
            setShowORLine((allFeatures.enable_social_oauth_login || allFeatures.sso_enforced_for_signin) && (allFeatures.enable_email_code_login || allFeatures.enable_email_password_login))
            // 根据是否允许邮箱密码登录来设置默认认证方式
            updateAuthType(allFeatures.enable_email_password_login ? 'password' : 'code')
        
            // 如果是邀请链接，验证邀请
            if (isInviteLink) {
                const checkRes = await invitationCheck({
                    url: '/activate/check',
                    params: {
                        token: invite_token,
                    },
                })

                setWorkSpaceName(checkRes?.data?.workspace_name || '')
                // 获取并设置工作区名称
            }
        }
        catch (error) {
            console.error(error)
            // 打印错误日志
            setAllMethodAreDisabled(true)
            // 如果发生错误，禁止使用所有认证方法
            setSystemFeatures(defaultSystemFeatures)
            // 重置系统功能为默认值
        }
        finally {
            setIsLoading(false)  
            // 无论成功还是失败，加载完成
        }
    }, [consoleToken, refreshToken, message, router, invite_token, isInviteLink])  
    // 依赖项：consoleToken、refreshToken 等

    useEffect(() => {
        // 组件加载的时候调用初始化函数
        init()
    }, [init])
    // 依赖项：init

    // 如果许可证状态为 LOST，显示相应提示
    if (systemFeatures.license?.status === LicenseStatus.LOST) {
        return 
            <div className='w-full mx-auto mt-8'>
                <div className='bg-white'>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-components-card-bg shadow shadows-shadow-lg mb-2 relative">
                            <RiContractLine className='w-5 h-5' /> 
                            <RiErrorWarningFill className='absolute w-4 h-4 text-text-warning-secondary -top-1 -right-1' /> 
                        </div>
                        <p className='system-sm-medium text-text-primary'>{t('login.licenseLost')}</p>
                        <p className='system-xs-regular text-text-tertiary mt-1'>{t('login.licenseLostTip')}</p>
                    </div>
                </div>
            </div>
    }

    // 如果许可证状态为 EXPIRED，显示相应提示
    if (systemFeatures.license?.status === LicenseStatus.EXPIRED) {
        return <div className='w-full mx-auto mt-8'>
          <div className='bg-white'>
            <div className="p-4 rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2">
              <div className='flex items-center justify-center w-10 h-10 rounded-xl bg-components-card-bg shadow shadows-shadow-lg mb-2 relative'>
                <RiContractLine className='w-5 h-5' />  {/* 图标 */}
                <RiErrorWarningFill className='absolute w-4 h-4 text-text-warning-secondary -top-1 -right-1' />  {/* 错误提示图标 */}
              </div>
              <p className='system-sm-medium text-text-primary'>{t('login.licenseExpired')}</p>
              <p className='system-xs-regular text-text-tertiary mt-1'>{t('login.licenseExpiredTip')}</p>
            </div>
          </div>
        </div>
    }

    // 如果许可证状态为 INACTIVE，显示相应提示
    if (systemFeatures.license?.status === LicenseStatus.INACTIVE) {
        return <div className='w-full mx-auto mt-8'>
          <div className='bg-white'>
            <div className="p-4 rounded-lg bg-gradient-to-r from-workflow-workflow-progress-bg-1 to-workflow-workflow-progress-bg-2">
              <div className='flex items-center justify-center w-10 h-10 rounded-xl bg-components-card-bg shadow shadows-shadow-lg mb-2 relative'>
                <RiContractLine className='w-5 h-5' />  {/* 图标 */}
                <RiErrorWarningFill className='absolute w-4 h-4 text-text-warning-secondary -top-1 -right-1' />  {/* 错误提示图标 */}
              </div>
              <p className='system-sm-medium text-text-primary'>{t('login.licenseInactive')}</p>
              <p className='system-xs-regular text-text-tertiary mt-1'>{t('login.licenseInactiveTip')}</p>
            </div>
          </div>
        </div>
    }

    return (
        
        // 渲染登录表单

        <>
            <div className="w-full mx-auto mt-8">
                {isInviteLink // 如果是邀请链接就显示工作区相关信息
                
                ?
                <div className="w-full mx-auto">
                    <h2 className="title-4xl-semi-bold text-text-primary">{t('login.join')}{workspaceName}</h2>
                    <p className='mt-2 body-md-regular text-text-tertiary'>{t('login.joinTipStart')}{workspaceName}{t('login.joinTipEnd')}</p>                    
                </div>
                :
                <div className="w-full mx-auto">
                    <h2 className="title-4xl-semi-bold text-text-primary">{t('login.pageTitle')}</h2>
                    <p className='mt-2 body-md-regular text-text-tertiary'>{t('login.welcome')}</p>                    
                </div>
                }
                <div className="bg-white">
                    <div className="flex flex-col gap-3 mt-6">
                        {systemFeatures.enable_social_oauth_login && <SocialAuth />}
                        {/* 显示社交登录组件 */}
                        {systemFeatures.sso_enforced_for_signin &&
                            <div className='w-full'>
                                <SSOAuth protocol={systemFeatures.sso_enforced_for_signin_protocol} /> 
                                {/* 显示 SSO 登录组件 */}
                            </div>
                        }   
                    </div>
                    {showORLine && 
                        <div className="relative mt-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className='bg-gradient-to-r from-background-gradient-mask-transparent via-divider-regular to-background-gradient-mask-transparent h-px w-full'></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 text-text-tertiary system-xs-medium-uppercase bg-white">{t('login.or')}</span>
                            </div>
                        </div>
                    }

                    {
                        (systemFeatures.enable_email_code_login || systemFeatures.enable_email_password_login) && 
                            <>
                                    {systemFeatures.enable_email_code_login && authType === 'code' && 
                                        <>
                                            <MailAndCodeAuth isInvite={isInviteLink} />  
                                            {/* 显示邮箱验证码登录组件 */}
                                            
                                            {systemFeatures.enable_email_password_login && 
                                                <div className='cursor-pointer py-1 text-center' onClick={() => { updateAuthType('password') }}>
                                                    <span className='system-xs-medium text-components-button-secondary-accent-text'>{t('login.usePassword')}</span>
                                                </div>
                                            }
                                        </>
                                    }
                                    {systemFeatures.enable_email_password_login && authType === 'password' && 
                                        <>
                                            <MailAndPasswordAuth isInvite={isInviteLink} isEmailSetup={systemFeatures.is_email_setup} allowRegistration={systemFeatures.is_allow_register} />  
                                            {/* 显示邮箱密码登录组件 */}
                                            {systemFeatures.enable_email_code_login && 
                                                <div className='cursor-pointer py-1 text-center' onClick={() => { updateAuthType('code') }}>
                                                    <span className='system-xs-medium text-components-button-secondary-accent-text'>{t('login.useVerificationCode')}</span>
                                                </div>
                                            }
                                        </>
                                    }
                            </>
                      }

                </div>
            </div>
        </>
    )

}

export default NormalForm // 导出登录表单组件