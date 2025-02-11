import { Icon } from "@iconify/react";
import { useState } from "react";
import type { ReactNode } from "react";

interface Manager {
	id: string;
	name: string;
	icon: ReactNode;
	getCommand: (
		packageName: string,
		isDev: boolean,
		useShorthand?: boolean,
	) => string;
}

interface SlotProps {
	className?: string;
	children?: ReactNode;
}

interface TabSlotProps extends SlotProps {
	isSelected: boolean;
	onClick: () => void;
}

interface CopyButtonSlotProps extends SlotProps {
	onClick: () => void;
}

interface Slots {
	root?: (props: SlotProps) => ReactNode;
	navigation?: (props: SlotProps) => ReactNode;
	tab?: (props: TabSlotProps) => ReactNode;
	commandContainer?: (props: SlotProps) => ReactNode;
	commandPrefix?: (props: SlotProps) => ReactNode;
	commandText?: (props: SlotProps) => ReactNode;
	copyButton?: (props: CopyButtonSlotProps) => ReactNode;
}

const cn = (...classes: string[]) => {
	return classes.filter(Boolean).join(" ");
};

const defaultManagers: Manager[] = [
	{
		id: "npm",
		name: "npm",
		icon: <Icon icon="logos:npm-icon" className="h-4 w-4" />,
		getCommand: (pkg: string, isDev: boolean, useShorthand = false) =>
			`npm ${isDev ? (useShorthand ? "i -D" : "install -D") : useShorthand ? "i" : "install"} ${pkg}`,
	},
	{
		id: "yarn",
		name: "Yarn",
		icon: <Icon icon="logos:yarn" className="h-4 w-4" />,
		getCommand: (pkg: string, isDev: boolean) =>
			`yarn add ${isDev ? "-D" : ""} ${pkg}`,
	},
	{
		id: "pnpm",
		name: "pnpm",
		icon: <Icon icon="logos:pnpm" className="h-4 w-4" />,
		getCommand: (pkg: string, isDev: boolean, useShorthand = false) =>
			`pnpm ${useShorthand ? "i" : "add"} ${isDev ? "-D" : ""} ${pkg}`,
	},
	{
		id: "bun",
		name: "Bun",
		icon: <Icon icon="logos:bun" className="h-4 w-4" />,
		getCommand: (pkg: string, isDev: boolean, useShorthand = false) =>
			`bun ${useShorthand ? "i" : "add"} ${isDev ? "-d" : ""} ${pkg}`,
	},
	{
		id: "deno",
		name: "Deno",
		icon: <Icon icon="logos:deno" className="h-4 w-4" />,
		getCommand: (pkg: string, isDev: boolean) =>
			`deno add ${isDev ? "--dev" : ""} ${pkg}`,
	},
];

const defaultSlots = {
	root: ({ children, className }: SlotProps) => (
		<div
			className={cn(
				"rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
				className || "",
			)}
		>
			{children}
		</div>
	),
	navigation: ({ children, className }: SlotProps) => (
		<div
			className={cn(
				"mb-8 flex flex-wrap gap-x-6 gap-y-2 border-zinc-200 border-b dark:border-zinc-800",
				className || "",
			)}
		>
			{children}
		</div>
	),
	tab: ({ children, isSelected, onClick, className }: TabSlotProps) => (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center gap-2 px-1 pb-2 text-sm transition-colors",
				isSelected
					? "border-emerald-500 border-b-2 text-zinc-900 dark:text-zinc-100"
					: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300",
				className || "",
			)}
		>
			{children}
		</button>
	),
	commandContainer: ({ children, className }: SlotProps) => (
		<div
			className={cn(
				"bg-zinc-50 dark:bg-zinc-950",
				"rounded-lg border border-zinc-200 dark:border-zinc-800",
				"p-4",
				"flex items-center justify-between",
				"group relative",
				className || "",
			)}
		>
			{children}
		</div>
	),
	commandPrefix: ({ className }: SlotProps) => (
		<span className={cn("text-zinc-400 dark:text-zinc-500", className || "")}>
			$
		</span>
	),
	commandText: ({ children, className }: SlotProps) => {
		const text = String(children);
		const parts = text.split(/\s+/);
		const command = parts[0];
		const rest = parts.slice(1).join(" ");

		return (
			<code
				className={cn(
					"font-mono text-zinc-800 dark:text-zinc-200",
					className || "",
				)}
			>
				<span className="font-medium text-blue-600 dark:text-blue-400">
					{command}
				</span>
				{rest ? ` ${rest}` : ""}
			</code>
		);
	},
	copyButton: ({ onClick, className }: CopyButtonSlotProps) => (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200",
				"md:opacity-0 md:transition-opacity md:group-hover:opacity-100",
				className || "",
			)}
			aria-label="Copy command"
		>
			<Icon icon="carbon:copy" className="h-5 w-5" />
		</button>
	),
};

export interface InstallCommandProps {
	/**
	 * The name of the package to generate install commands for
	 */
	packageName?: string;

	/**
	 * Whether to install as a dev dependency
	 * @default false
	 */
	isDev?: boolean;

	/**
	 * Whether to use shorthand commands (e.g. 'npm i' instead of 'npm install')
	 * @default false
	 */
	useShorthand?: boolean;

	/**
	 * Array of package managers to display
	 * @default defaultManagers
	 */
	managers?: Manager[];

	/**
	 * The initially selected package manager
	 * @default first manager in the array
	 */
	defaultManager?: string;

	/**
	 * Custom commands to override the default ones
	 */
	customCommands?: Record<string, string>;

	/**
	 * Custom slot components for rendering
	 */
	slots?: Slots;

	/**
	 * Custom classNames for each slot
	 */
	slotClassNames?: {
		root?: string;
		navigation?: string;
		tab?: string;
		commandContainer?: string;
		commandPrefix?: string;
		commandText?: string;
		copyButton?: string;
	};

	/**
	 * Callback fired when the command is copied
	 * @param command The command that was copied
	 * @param manager The current package manager
	 */
	onCopy?: (command: string, manager: Manager) => void;

	/**
	 * Callback fired when the selected package manager changes
	 * @param managerId The ID of the newly selected manager
	 * @param manager The newly selected manager object
	 */
	onTabChange?: (managerId: string, manager: Manager) => void;
}

const InstallCommand = ({
	packageName = "",
	isDev = false,
	useShorthand = false,
	managers = defaultManagers,
	defaultManager,
	customCommands,
	slots = {},
	slotClassNames = {},
	onCopy,
	onTabChange,
}: InstallCommandProps) => {
	const [selectedManager, setSelectedManager] = useState(
		defaultManager || managers[0]?.id,
	);

	const mergedSlots = { ...defaultSlots, ...slots };
	const {
		root: Root,
		navigation: Navigation,
		tab: Tab,
		commandContainer: CommandContainer,
		commandPrefix: CommandPrefix,
		commandText: CommandText,
		copyButton: CopyButton,
	} = mergedSlots;

	const getCommand = (managerId: string) => {
		if (customCommands?.[managerId]) {
			return customCommands[managerId];
		}

		const manager = managers.find((m) => m.id === managerId);
		if (manager?.getCommand) {
			return manager.getCommand(packageName, isDev, useShorthand);
		}

		return "";
	};

	const handleTabChange = (managerId: string) => {
		setSelectedManager(managerId);
		const manager = managers.find((m) => m.id === managerId);
		if (onTabChange && manager) {
			onTabChange(managerId, manager);
		}
	};

	const handleCopy = () => {
		const command = getCommand(selectedManager);
		navigator.clipboard.writeText(command);
		const manager = managers.find((m) => m.id === selectedManager);
		if (onCopy && manager) {
			onCopy(command, manager);
		}
	};

	if (managers.length === 0) {
		return null;
	}

	const currentCommand = getCommand(selectedManager);

	return (
		<Root className={slotClassNames.root}>
			<Navigation className={slotClassNames.navigation}>
				{managers.map((manager) => (
					<Tab
						key={manager.id}
						isSelected={selectedManager === manager.id}
						onClick={() => handleTabChange(manager.id)}
						className={slotClassNames.tab}
					>
						{manager.icon}
						<span>{manager.name}</span>
					</Tab>
				))}
			</Navigation>

			<CommandContainer className={slotClassNames.commandContainer}>
				<div className="flex items-center gap-2">
					<CommandPrefix className={slotClassNames.commandPrefix} />
					<CommandText className={slotClassNames.commandText}>
						{currentCommand}
					</CommandText>
				</div>
				<CopyButton
					className={slotClassNames.copyButton}
					onClick={handleCopy}
				/>
			</CommandContainer>
		</Root>
	);
};

export default InstallCommand;
