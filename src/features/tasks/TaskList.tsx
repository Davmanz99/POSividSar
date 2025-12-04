import { Task, User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TaskListProps {
    tasks: Task[];
    currentUser: User;
    onToggleStatus: (taskId: string, currentStatus: 'PENDING' | 'COMPLETED') => void;
    onDelete?: (taskId: string) => void;
    usersMap: Record<string, User>; // To look up names
}

export function TaskList({ tasks, currentUser, onToggleStatus, onDelete, usersMap }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No hay tareas asignadas.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => {
                const isAssignedToMe = task.assignedToId === currentUser.id;
                const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
                const assignee = usersMap[task.assignedToId];
                const assigner = usersMap[task.assignedById];

                return (
                    <Card key={task.id} className={`border-l-4 ${task.status === 'COMPLETED' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
                                <Badge variant={task.status === 'COMPLETED' ? 'default' : 'outline'} className={task.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' : 'text-yellow-500 border-yellow-500'}>
                                    {task.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Vence: {task.dueDate ? format(new Date(task.dueDate), "d 'de' MMMM, HH:mm", { locale: es }) : 'Sin fecha'}
                                {task.isRecurring && (
                                    <span className="ml-2 text-blue-400 font-semibold">(↻ Diaria)</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {task.description && (
                                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                            )}

                            <div className="text-xs space-y-1 mb-4">
                                <p>Asignado a: <span className="font-medium">{assignee?.name || 'Desconocido'}</span></p>
                                <p>Por: <span className="font-medium">{assigner?.name || 'Desconocido'}</span></p>
                            </div>

                            <div className="flex justify-end gap-2">
                                {isAdmin && onDelete && (
                                    <Button variant="destructive" size="sm" onClick={() => onDelete(task.id)}>
                                        Eliminar
                                    </Button>
                                )}

                                {(isAssignedToMe || isAdmin) && (
                                    <Button
                                        variant={task.status === 'COMPLETED' ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => onToggleStatus(task.id, task.status)}
                                    >
                                        {task.status === 'COMPLETED' ? 'Marcar Pendiente' : 'Marcar Completada'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
