import { useState, useMemo } from "react"
import { useStore } from "@/store/store"
import { TaskList } from "./TaskList"
import { CreateTaskDialog, TaskFormData } from "./CreateTaskDialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import { Task } from "@/types"

export function TasksPage() {
    const { tasks, users, currentUser, addTask, updateTask, deleteTask } = useStore()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

    // Filter tasks based on role and local
    const filteredTasks = useMemo(() => {
        if (!currentUser) return []

        return tasks.filter(task => {
            // Must belong to same local (unless Super Admin sees all? Let's assume local scope)
            if (currentUser.role !== 'SUPER_ADMIN' && task.localId !== currentUser.localId) {
                return false
            }

            if (isAdmin) {
                return true // Admin sees all tasks in local
            } else {
                return task.assignedToId === currentUser.id // Seller sees only assigned
            }
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [tasks, currentUser, isAdmin])

    // Get sellers for the dropdown (Admin only)
    const sellers = useMemo(() => {
        if (!currentUser) return []
        return users.filter(u =>
            u.role === 'SELLER' &&
            (currentUser.role === 'SUPER_ADMIN' || u.localId === currentUser.localId)
        )
    }, [users, currentUser])

    // Create a map of users for easy lookup in TaskList
    const usersMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.id] = user
            return acc
        }, {} as Record<string, typeof users[0]>)
    }, [users])

    const handleCreateTask = async (data: TaskFormData) => {
        if (!currentUser) return

        const newTask: Task = {
            id: uuidv4(),
            localId: currentUser.localId || '', // Fallback?
            assignedToId: data.assignedToId,
            assignedById: currentUser.id,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        }

        addTask(newTask)
        setIsCreateDialogOpen(false)
    }

    const handleToggleStatus = (taskId: string, currentStatus: 'PENDING' | 'COMPLETED') => {
        const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING'
        updateTask(taskId, {
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
        })
    }

    const handleDeleteTask = (taskId: string) => {
        if (confirm('¿Estás seguro de eliminar esta tarea?')) {
            deleteTask(taskId)
        }
    }

    if (!currentUser) return null

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Tareas</h1>
                    <p className="text-muted-foreground">
                        {isAdmin ? 'Gestiona y asigna tareas a tu equipo.' : 'Revisa tus tareas pendientes.'}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsCreateDialogOpen(true)} variant="neon">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                )}
            </div>

            <TaskList
                tasks={filteredTasks}
                currentUser={currentUser}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteTask}
                usersMap={usersMap}
            />

            <CreateTaskDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateTask}
                sellers={sellers}
            />
        </div>
    )
}
