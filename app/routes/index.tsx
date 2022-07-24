import { Popover, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { Link } from "@remix-run/react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

export default function IndexRoute() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="relative z-10 bg-white pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
          <svg
            className="absolute inset-y-0 right-0 hidden h-full w-48 translate-x-1/2 transform text-white lg:block"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <Popover>
            <div className="relative px-4 pt-6 sm:px-6 lg:px-8">
              <nav
                className="relative flex items-center justify-between sm:h-10 lg:justify-start"
                aria-label="Global"
              >
                <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
                  <div className="flex w-full items-center justify-between md:w-auto">
                    <span className="text-xl font-bold">{t("name")}</span>
                    <div className="-mr-2 flex items-center md:hidden">
                      <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500">
                        <span className="sr-only">
                          {t("accessibility.open_main_menu")}
                        </span>
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                </div>
                <div className="hidden md:ml-10 md:block md:space-x-8 md:pr-4">
                  <Link
                    to="dashboard"
                    className="font-medium text-gray-500 hover:text-gray-900"
                  >
                    {t("page.home.nav.dashboard")}
                  </Link>
                  <a
                    href="https://blog.emilioschepis.com/series/planetscale-hackathon"
                    className="font-medium text-gray-500 hover:text-gray-900"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("page.home.nav.hackathon")}
                  </a>
                  <Link
                    to="login"
                    className="font-medium text-emerald-700 hover:text-emerald-600"
                  >
                    {t("page.home.login_cta")}
                  </Link>
                </div>
              </nav>
            </div>

            <Transition
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel
                focus
                className="absolute inset-x-0 top-0 z-10 origin-top-right transform p-2 transition md:hidden"
              >
                <div className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black ring-opacity-5">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <div>
                      <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/workflow-mark-emerald-600.svg"
                        alt=""
                      />
                    </div>
                    <div className="-mr-2">
                      <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500">
                        <span className="sr-only">
                          {t("accessibility.close_main_menu")}
                        </span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="space-y-1 px-2 pt-2 pb-3">
                    <Link
                      to="dashboard"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {t("page.home.nav.dashboard")}
                    </Link>
                    <a
                      href="https://blog.emilioschepis.com/series/planetscale-hackathon"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("page.home.nav.hackathon")}
                    </a>
                  </div>
                  <Link
                    to="login"
                    className="block w-full bg-gray-50 px-5 py-3 text-center font-medium text-emerald-600 hover:bg-gray-100"
                  >
                    {t("page.home.login_cta")}
                  </Link>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">
                  {t("page.home.title_one")}
                </span>{" "}
                <span className="block text-emerald-600 xl:inline">
                  {t("page.home.title_two")}
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                {t("page.home.description")}
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    to="register"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700 md:py-4 md:px-10 md:text-lg"
                  >
                    {t("page.home.register_cta")}
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="https://github.com/emilioschepis/localizard"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-emerald-100 px-8 py-3 text-base font-medium text-emerald-700 hover:bg-emerald-200 md:py-4 md:px-10 md:text-lg"
                  >
                    {t("page.home.source_cta")}
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:h-full lg:w-full"
          src="https://images.unsplash.com/photo-1604549944235-3e5579b15cc2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1771&q=80"
          alt=""
        />
      </div>
    </div>
  );
}
